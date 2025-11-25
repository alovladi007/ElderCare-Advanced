/**
 * Smart Home Automation Engine
 * Evaluates and executes automation rules based on triggers and conditions
 */

const Automation = require('../models/Automation');
const SmartDevice = require('../models/SmartDevice');
const Scene = require('../models/Scene');
const DeviceEvent = require('../models/DeviceEvent');

class AutomationEngine {
  constructor() {
    this.isRunning = false;
    this.timeCheckInterval = null;
    this.eventSubscribers = [];
  }

  /**
   * Start the automation engine
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Automation Engine already running');
      return;
    }

    this.isRunning = true;
    console.log('✓ Automation Engine started');

    // Start time-based automation checker (runs every minute)
    this.timeCheckInterval = setInterval(() => {
      this.checkTimeBasedAutomations();
    }, 60000); // Check every minute

    // Initial check
    this.checkTimeBasedAutomations();
  }

  /**
   * Stop the automation engine
   */
  stop() {
    if (this.timeCheckInterval) {
      clearInterval(this.timeCheckInterval);
      this.timeCheckInterval = null;
    }
    this.isRunning = false;
    console.log('✓ Automation Engine stopped');
  }

  /**
   * Check and execute time-based automations
   */
  async checkTimeBasedAutomations() {
    try {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];

      const automations = await Automation.find({
        enabled: true,
        type: 'time'
      });

      for (const automation of automations) {
        // Check if time matches
        if (automation.trigger.time === currentTime) {
          // Check if day matches (if days specified)
          if (!automation.trigger.days || automation.trigger.days.length === 0 ||
              automation.trigger.days.includes(currentDay)) {

            // Check conditions
            if (await this.evaluateConditions(automation.conditions)) {
              await this.executeAutomation(automation);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking time-based automations:', error);
    }
  }

  /**
   * Handle device event and check event-based automations
   */
  async handleDeviceEvent(deviceId, eventType, newState, previousState) {
    try {
      const automations = await Automation.find({
        enabled: true,
        type: 'event',
        'trigger.device': deviceId
      });

      for (const automation of automations) {
        // Check if event type matches
        if (automation.trigger.event === eventType) {
          // For condition-based events (e.g., temperature above X)
          if (automation.trigger.operator && automation.trigger.value !== undefined) {
            const matches = this.evaluateOperator(
              newState,
              automation.trigger.operator,
              automation.trigger.value
            );

            if (matches && await this.evaluateConditions(automation.conditions)) {
              await this.executeAutomation(automation);
            }
          } else {
            // Simple event trigger (e.g., motion detected, door opened)
            if (await this.evaluateConditions(automation.conditions)) {
              await this.executeAutomation(automation);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error handling device event:', error);
    }
  }

  /**
   * Evaluate automation conditions
   */
  async evaluateConditions(conditions) {
    if (!conditions || conditions.length === 0) {
      return true; // No conditions = always true
    }

    try {
      for (const condition of conditions) {
        const device = await SmartDevice.findById(condition.device);
        if (!device) continue;

        const value = device.state[condition.property];
        const conditionMet = this.evaluateOperator(value, condition.operator, condition.value);

        if (!conditionMet) {
          return false; // All conditions must be true (AND logic)
        }
      }

      return true;
    } catch (error) {
      console.error('Error evaluating conditions:', error);
      return false;
    }
  }

  /**
   * Evaluate comparison operators
   */
  evaluateOperator(actualValue, operator, expectedValue) {
    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'above':
        return actualValue > expectedValue;
      case 'below':
        return actualValue < expectedValue;
      case 'between':
        return actualValue >= expectedValue[0] && actualValue <= expectedValue[1];
      default:
        return false;
    }
  }

  /**
   * Execute automation actions
   */
  async executeAutomation(automation) {
    try {
      console.log(`🤖 Executing automation: ${automation.name}`);

      for (const action of automation.actions) {
        // Apply delay if specified
        if (action.delay && action.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, action.delay));
        }

        switch (action.type) {
          case 'device':
            await this.executeDeviceAction(action, automation);
            break;

          case 'scene':
            await this.executeSceneAction(action, automation);
            break;

          case 'notification':
            await this.executeNotificationAction(action, automation);
            break;

          case 'delay':
            await new Promise(resolve => setTimeout(resolve, action.delay));
            break;

          default:
            console.warn(`Unknown action type: ${action.type}`);
        }
      }

      // Update automation execution stats
      automation.executionCount += 1;
      automation.lastExecuted = new Date();
      await automation.save();

      console.log(`✓ Automation executed: ${automation.name}`);
    } catch (error) {
      console.error(`Error executing automation ${automation.name}:`, error);
    }
  }

  /**
   * Execute device control action
   */
  async executeDeviceAction(action, automation) {
    try {
      const device = await SmartDevice.findById(action.device);
      if (!device) {
        console.warn(`Device not found: ${action.device}`);
        return;
      }

      const previousState = { ...device.state.toObject() };

      // Apply new state
      Object.keys(action.state).forEach(key => {
        if (action.state[key] !== undefined) {
          device.state[key] = action.state[key];
        }
      });

      device.lastSeen = new Date();
      await device.save();

      // Log event
      await DeviceEvent.create({
        device: device._id,
        home: device.home,
        eventType: 'state_change',
        previousState,
        newState: device.state,
        triggeredBy: 'automation',
        automation: automation._id
      });

      console.log(`  ✓ Device ${device.name} state updated`);
    } catch (error) {
      console.error('Error executing device action:', error);
    }
  }

  /**
   * Execute scene action
   */
  async executeSceneAction(action, automation) {
    try {
      const scene = await Scene.findById(action.scene).populate('actions.device');
      if (!scene) {
        console.warn(`Scene not found: ${action.scene}`);
        return;
      }

      // Execute each device action in the scene
      for (const sceneAction of scene.actions) {
        const device = await SmartDevice.findById(sceneAction.device);
        if (!device) continue;

        const previousState = { ...device.state.toObject() };

        // Apply scene action state
        Object.keys(sceneAction.state).forEach(key => {
          if (sceneAction.state[key] !== undefined) {
            device.state[key] = sceneAction.state[key];
          }
        });

        device.lastSeen = new Date();
        await device.save();

        // Log event
        await DeviceEvent.create({
          device: device._id,
          home: device.home,
          eventType: 'state_change',
          previousState,
          newState: device.state,
          triggeredBy: 'automation',
          automation: automation._id,
          scene: scene._id
        });

        // Apply scene action delay
        if (sceneAction.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, sceneAction.delay));
        }
      }

      // Update scene stats
      scene.executionCount += 1;
      scene.lastExecuted = new Date();
      await scene.save();

      console.log(`  ✓ Scene ${scene.name} executed`);
    } catch (error) {
      console.error('Error executing scene action:', error);
    }
  }

  /**
   * Execute notification action
   */
  async executeNotificationAction(action, automation) {
    try {
      const notification = action.notification;

      // TODO: Implement actual notification sending (email, push, SMS)
      // For now, just log
      console.log(`  📬 Notification: ${notification.title}`);
      console.log(`     ${notification.message}`);
      console.log(`     Priority: ${notification.priority}`);

      // Could integrate with:
      // - Email service (SendGrid, AWS SES)
      // - Push notifications (Firebase, OneSignal)
      // - SMS (Twilio)
      // - WebSocket broadcast to connected clients
    } catch (error) {
      console.error('Error executing notification action:', error);
    }
  }

  /**
   * Get automation suggestions based on usage patterns (AI foundation)
   */
  async getAutomationSuggestions(homeId, limit = 5) {
    try {
      // Get recent device events
      const events = await DeviceEvent.find({
        home: homeId,
        eventType: 'state_change',
        triggeredBy: 'user' // Only user-triggered actions
      })
        .sort({ createdAt: -1 })
        .limit(1000)
        .populate('device');

      const suggestions = [];

      // Pattern 1: Recurring time-based actions
      const timePatterns = this.analyzeTimePatterns(events);
      suggestions.push(...timePatterns);

      // Pattern 2: Correlated device actions
      const correlatedActions = this.analyzeCorrelatedActions(events);
      suggestions.push(...correlatedActions);

      // Pattern 3: Energy optimization
      const energySuggestions = this.analyzeEnergySavings(events);
      suggestions.push(...energySuggestions);

      return suggestions.slice(0, limit);
    } catch (error) {
      console.error('Error generating automation suggestions:', error);
      return [];
    }
  }

  /**
   * Analyze time-based patterns in user behavior
   */
  analyzeTimePatterns(events) {
    // Group events by device and hour
    const deviceHourMap = {};

    events.forEach(event => {
      if (!event.device) return;

      const hour = new Date(event.createdAt).getHours();
      const key = `${event.device._id}_${hour}`;

      if (!deviceHourMap[key]) {
        deviceHourMap[key] = {
          device: event.device,
          hour,
          count: 0,
          states: []
        };
      }

      deviceHourMap[key].count++;
      deviceHourMap[key].states.push(event.newState);
    });

    // Find patterns that occur frequently
    const suggestions = [];
    Object.values(deviceHourMap).forEach(pattern => {
      if (pattern.count >= 3) { // Occurred at least 3 times
        suggestions.push({
          type: 'time_pattern',
          confidence: Math.min(pattern.count / 10, 1), // 0-1 confidence score
          title: `Auto-${pattern.device.name} at ${pattern.hour}:00`,
          description: `You often control ${pattern.device.name} around ${pattern.hour}:00. Create an automation?`,
          automation: {
            type: 'time',
            trigger: {
              time: `${pattern.hour.toString().padStart(2, '0')}:00`,
              days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
            },
            actions: [{
              type: 'device',
              device: pattern.device._id,
              state: pattern.states[pattern.states.length - 1] // Most recent state
            }]
          }
        });
      }
    });

    return suggestions;
  }

  /**
   * Analyze correlated device actions
   */
  analyzeCorrelatedActions(events) {
    // TODO: Implement correlation analysis
    // Find devices that are often controlled together within a short time window
    return [];
  }

  /**
   * Analyze energy savings opportunities
   */
  analyzeEnergySavings(events) {
    // TODO: Implement energy analysis
    // Find devices left on for long periods, suggest auto-off
    return [];
  }
}

// Export singleton instance
module.exports = new AutomationEngine();
