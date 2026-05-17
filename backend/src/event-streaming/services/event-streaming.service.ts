import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';

export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  data: any;
  metadata?: any;
  timestamp: Date;
  version: number;
}

export interface EventHandler {
  eventType: string;
  handle: (event: DomainEvent) => Promise<void>;
}

@Injectable()
export class EventStreamingService implements OnModuleInit {
  private readonly logger = new Logger(EventStreamingService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private readonly useKafka: boolean;
  private readonly inMemoryEvents: DomainEvent[] = [];

  constructor(private config: ConfigService) {
    this.useKafka = this.config.get<boolean>('USE_KAFKA') === true;

    if (this.useKafka) {
      const brokers = this.config.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'];

      this.kafka = new Kafka({
        clientId: 'eldercare-platform',
        brokers,
        retry: {
          initialRetryTime: 100,
          retries: 8,
        },
      });

      this.producer = this.kafka.producer({
        idempotent: true,
        maxInFlightRequests: 5,
        transactionalId: 'eldercare-transactional-producer',
      });
    }
  }

  async onModuleInit() {
    if (this.useKafka) {
      try {
        await this.producer.connect();
        this.logger.log('Kafka producer connected successfully');
      } catch (error) {
        this.logger.error(`Failed to connect Kafka producer: ${error.message}`);
        this.logger.warn('Falling back to in-memory event bus');
      }
    } else {
      this.logger.log('Using in-memory event bus (Kafka disabled)');
    }
  }

  /**
   * Publish event to Kafka or in-memory event bus
   */
  async publishEvent(topic: string, event: DomainEvent): Promise<void> {
    try {
      if (this.useKafka && this.producer) {
        await this.producer.send({
          topic,
          messages: [
            {
              key: event.aggregateId,
              value: JSON.stringify(event),
              headers: {
                'event-type': event.type,
                'aggregate-type': event.aggregateType,
                'event-id': event.id,
                'timestamp': event.timestamp.toISOString(),
              },
            },
          ],
        });

        this.logger.debug(`Event published to Kafka topic ${topic}: ${event.type}`);
      } else {
        // In-memory fallback
        this.inMemoryEvents.push(event);
        await this.processInMemoryEvent(topic, event);
        this.logger.debug(`Event published to in-memory bus: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to publish event: ${error.message}`, error.stack);
      // Fallback to in-memory even if Kafka fails
      this.inMemoryEvents.push(event);
      await this.processInMemoryEvent(topic, event);
    }
  }

  /**
   * Publish multiple events in a transaction
   */
  async publishEventsBatch(topic: string, events: DomainEvent[]): Promise<void> {
    if (this.useKafka && this.producer) {
      try {
        await this.producer.sendBatch({
          topicMessages: [
            {
              topic,
              messages: events.map(event => ({
                key: event.aggregateId,
                value: JSON.stringify(event),
                headers: {
                  'event-type': event.type,
                  'aggregate-type': event.aggregateType,
                },
              })),
            },
          ],
        });

        this.logger.debug(`${events.length} events published to Kafka topic ${topic}`);
      } catch (error) {
        this.logger.error(`Failed to publish event batch: ${error.message}`);
        // Fallback
        for (const event of events) {
          this.inMemoryEvents.push(event);
          await this.processInMemoryEvent(topic, event);
        }
      }
    } else {
      for (const event of events) {
        this.inMemoryEvents.push(event);
        await this.processInMemoryEvent(topic, event);
      }
    }
  }

  /**
   * Subscribe to events from a topic
   */
  async subscribe(topic: string, groupId: string, handler: EventHandler): Promise<void> {
    // Register handler
    if (!this.eventHandlers.has(topic)) {
      this.eventHandlers.set(topic, []);
    }
    this.eventHandlers.get(topic).push(handler);

    if (this.useKafka) {
      await this.subscribeKafka(topic, groupId, handler);
    }
  }

  /**
   * Subscribe to multiple topics
   */
  async subscribeMultiple(topics: string[], groupId: string, handler: EventHandler): Promise<void> {
    for (const topic of topics) {
      await this.subscribe(topic, groupId, handler);
    }
  }

  /**
   * Get event history for an aggregate
   */
  async getEventHistory(aggregateId: string, aggregateType: string): Promise<DomainEvent[]> {
    // In production, this would query an event store (e.g., EventStoreDB)
    return this.inMemoryEvents.filter(
      e => e.aggregateId === aggregateId && e.aggregateType === aggregateType
    ).sort((a, b) => a.version - b.version);
  }

  /**
   * Rebuild aggregate state from events (Event Sourcing)
   */
  async rebuildState<T>(
    aggregateId: string,
    aggregateType: string,
    initialState: T,
    applyEvent: (state: T, event: DomainEvent) => T
  ): Promise<T> {
    const events = await this.getEventHistory(aggregateId, aggregateType);
    return events.reduce(applyEvent, initialState);
  }

  // ============================================
  // PRIVATE METHODS - Kafka Integration
  // ============================================

  private async subscribeKafka(topic: string, groupId: string, handler: EventHandler): Promise<void> {
    try {
      const consumer = this.kafka.consumer({
        groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      });

      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });

      await consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleKafkaMessage(payload, handler);
        },
      });

      this.consumers.set(`${topic}-${groupId}`, consumer);
      this.logger.log(`Subscribed to Kafka topic: ${topic} with group: ${groupId}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to Kafka topic ${topic}: ${error.message}`);
    }
  }

  private async handleKafkaMessage(payload: EachMessagePayload, handler: EventHandler): Promise<void> {
    try {
      const event: DomainEvent = JSON.parse(payload.message.value.toString());

      if (event.type === handler.eventType) {
        await handler.handle(event);
        this.logger.debug(`Event handled: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error handling Kafka message: ${error.message}`, error.stack);
    }
  }

  private async processInMemoryEvent(topic: string, event: DomainEvent): Promise<void> {
    const handlers = this.eventHandlers.get(topic) || [];

    for (const handler of handlers) {
      if (handler.eventType === event.type || handler.eventType === '*') {
        try {
          await handler.handle(event);
        } catch (error) {
          this.logger.error(`Error in event handler: ${error.message}`, error.stack);
        }
      }
    }
  }

  // ============================================
  // CQRS Support
  // ============================================

  /**
   * Publish domain event for CQRS pattern
   */
  async publishDomainEvent(
    eventType: string,
    aggregateId: string,
    aggregateType: string,
    data: any,
    version: number = 1
  ): Promise<void> {
    const event: DomainEvent = {
      id: this.generateEventId(),
      type: eventType,
      aggregateId,
      aggregateType,
      data,
      timestamp: new Date(),
      version,
    };

    const topic = this.getTopicForAggregateType(aggregateType);
    await this.publishEvent(topic, event);
  }

  /**
   * Publish multiple domain events atomically
   */
  async publishDomainEventsBatch(
    events: Array<{
      eventType: string;
      aggregateId: string;
      aggregateType: string;
      data: any;
      version?: number;
    }>
  ): Promise<void> {
    const domainEvents: DomainEvent[] = events.map(e => ({
      id: this.generateEventId(),
      type: e.eventType,
      aggregateId: e.aggregateId,
      aggregateType: e.aggregateType,
      data: e.data,
      timestamp: new Date(),
      version: e.version || 1,
    }));

    // Group by aggregate type
    const eventsByTopic = new Map<string, DomainEvent[]>();

    for (const event of domainEvents) {
      const topic = this.getTopicForAggregateType(event.aggregateType);
      if (!eventsByTopic.has(topic)) {
        eventsByTopic.set(topic, []);
      }
      eventsByTopic.get(topic).push(event);
    }

    // Publish to each topic
    for (const [topic, topicEvents] of eventsByTopic.entries()) {
      await this.publishEventsBatch(topic, topicEvents);
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private getTopicForAggregateType(aggregateType: string): string {
    const topicMap: Record<string, string> = {
      'Elder': 'elder-events',
      'VitalReading': 'vital-signs',
      'Alert': 'alerts',
      'Medication': 'medications',
      'Activity': 'activities',
      'Device': 'device-readings',
      'Appointment': 'appointments',
    };

    return topicMap[aggregateType] || 'domain-events';
  }

  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get metrics about event streaming
   */
  async getMetrics(): Promise<any> {
    return {
      usingKafka: this.useKafka,
      inMemoryEventsCount: this.inMemoryEvents.length,
      subscribedTopics: Array.from(this.consumers.keys()),
      registeredHandlers: this.eventHandlers.size,
    };
  }

  /**
   * Cleanup on shutdown
   */
  async onModuleDestroy() {
    if (this.producer) {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    }

    for (const [key, consumer] of this.consumers.entries()) {
      await consumer.disconnect();
      this.logger.log(`Kafka consumer disconnected: ${key}`);
    }
  }
}

// ============================================
// Event Types for ElderCare Platform
// ============================================

export const EventTypes = {
  // Elder events
  ELDER_CREATED: 'ElderCreated',
  ELDER_UPDATED: 'ElderUpdated',
  ELDER_ARCHIVED: 'ElderArchived',

  // Vital events
  VITAL_RECORDED: 'VitalRecorded',
  VITAL_THRESHOLD_EXCEEDED: 'VitalThresholdExceeded',
  VITAL_TREND_DETECTED: 'VitalTrendDetected',

  // Alert events
  ALERT_TRIGGERED: 'AlertTriggered',
  ALERT_ACKNOWLEDGED: 'AlertAcknowledged',
  ALERT_RESOLVED: 'AlertResolved',
  EMERGENCY_DECLARED: 'EmergencyDeclared',

  // Medication events
  MEDICATION_ADDED: 'MedicationAdded',
  MEDICATION_TAKEN: 'MedicationTaken',
  MEDICATION_MISSED: 'MedicationMissed',
  MEDICATION_REMINDER_SENT: 'MedicationReminderSent',

  // Activity events
  ACTIVITY_DETECTED: 'ActivityDetected',
  FALL_DETECTED: 'FallDetected',
  INACTIVITY_DETECTED: 'InactivityDetected',

  // Device events
  DEVICE_CONNECTED: 'DeviceConnected',
  DEVICE_DISCONNECTED: 'DeviceDisconnected',
  DEVICE_READING_RECEIVED: 'DeviceReadingReceived',
  DEVICE_BATTERY_LOW: 'DeviceBatteryLow',

  // Appointment events
  APPOINTMENT_SCHEDULED: 'AppointmentScheduled',
  APPOINTMENT_REMINDER_SENT: 'AppointmentReminderSent',
  APPOINTMENT_COMPLETED: 'AppointmentCompleted',
  APPOINTMENT_MISSED: 'AppointmentMissed',

  // Care events
  CARE_PLAN_UPDATED: 'CarePlanUpdated',
  CAREGIVER_ASSIGNED: 'CaregiverAssigned',
  CARE_NOTE_ADDED: 'CareNoteAdded',
};
