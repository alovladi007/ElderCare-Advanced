import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Edge Computing Types
 */
export enum EdgeGatewayStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  DEGRADED = 'DEGRADED',
  MAINTENANCE = 'MAINTENANCE',
}

export enum EdgeMLModel {
  FALL_DETECTION = 'FALL_DETECTION',
  ACTIVITY_RECOGNITION = 'ACTIVITY_RECOGNITION',
  GAIT_ANALYSIS = 'GAIT_ANALYSIS',
  VOICE_ANALYSIS = 'VOICE_ANALYSIS',
  FACIAL_RECOGNITION = 'FACIAL_RECOGNITION',
  ANOMALY_DETECTION = 'ANOMALY_DETECTION',
  VITALS_PREDICTION = 'VITALS_PREDICTION',
}

export enum ProcessingMode {
  EDGE_ONLY = 'EDGE_ONLY',
  EDGE_FIRST = 'EDGE_FIRST',
  CLOUD_FIRST = 'CLOUD_FIRST',
  HYBRID = 'HYBRID',
}

export interface EdgeGateway {
  gatewayId: string;
  homeId: string;
  name: string;
  ipAddress: string;
  status: EdgeGatewayStatus;
  capabilities: EdgeCapability[];
  hardware: HardwareSpecs;
  models: EdgeMLModel[];
  metrics: EdgeMetrics;
  lastHeartbeat: Date;
}

export interface EdgeCapability {
  type: string;
  enabled: boolean;
  performance: number; // 0-100
  version: string;
}

export interface HardwareSpecs {
  cpu: string;
  memory: number; // GB
  storage: number; // GB
  accelerator?: 'GPU' | 'TPU' | 'VPU' | 'NPU';
  acceleratorModel?: string;
}

export interface EdgeMetrics {
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  networkBandwidth: number; // Mbps
  inferenceLatency: number; // ms
  throughput: number; // inferences per second
  powerConsumption: number; // watts
  temperature: number; // celsius
}

export interface EdgeInferenceRequest {
  gatewayId: string;
  model: EdgeMLModel;
  inputData: any;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  timeout?: number;
}

export interface EdgeInferenceResult {
  requestId: string;
  model: EdgeMLModel;
  result: any;
  confidence: number;
  latency: number;
  processedAt: Date;
  location: 'EDGE' | 'CLOUD';
}

export interface EdgeDataAggregation {
  startTime: Date;
  endTime: Date;
  dataPoints: number;
  aggregatedData: any;
  compression: number; // percentage reduced
  bandwidthSaved: number; // MB
}

export interface PrivacyFilter {
  type: 'VIDEO_BLUR' | 'AUDIO_MUTE' | 'DATA_ANONYMIZE' | 'PII_STRIP';
  enabled: boolean;
  config: any;
}

export interface EdgeSyncStatus {
  gatewayId: string;
  lastSync: Date;
  pendingItems: number;
  syncInProgress: boolean;
  queueSize: number; // MB
  estimatedSyncTime: number; // seconds
}

/**
 * Edge Computing Service
 * Manages edge gateways, local ML inference, data aggregation, and privacy filtering
 */
@Injectable()
export class EdgeComputingService {
  private readonly logger = new Logger(EdgeComputingService.name);
  private gatewayCache: Map<string, EdgeGateway> = new Map();
  private inferenceQueues: Map<string, any[]> = new Map();
  private syncQueues: Map<string, any[]> = new Map();
  private privacyFilters: Map<string, PrivacyFilter[]> = new Map();

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.initializeEdgeService();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeEdgeService() {
    this.logger.log('Initializing Edge Computing Service...');

    // Load default privacy filters
    this.initializePrivacyFilters();

    // Start periodic health checks
    this.startGatewayHealthChecks();

    this.logger.log('Edge Computing Service initialized successfully');
  }

  private initializePrivacyFilters() {
    // Default privacy-first configuration
    const defaultFilters: PrivacyFilter[] = [
      {
        type: 'VIDEO_BLUR',
        enabled: true,
        config: {
          blurFaces: true,
          blurPII: true,
          retainPose: true, // Keep skeletal data for fall detection
        },
      },
      {
        type: 'AUDIO_MUTE',
        enabled: true,
        config: {
          preserveEmotionalTone: true,
          stripSpeechContent: true,
          retainAmbientSound: true,
        },
      },
      {
        type: 'DATA_ANONYMIZE',
        enabled: true,
        config: {
          hashIds: true,
          removeLocations: false, // Need for context
          removeTimestamps: false,
        },
      },
    ];

    // Store default filters (would be loaded per-home in production)
    this.privacyFilters.set('default', defaultFilters);
  }

  private startGatewayHealthChecks() {
    // In production, this would be a scheduled job
    setInterval(async () => {
      await this.checkAllGatewayHealth();
    }, 60000); // Every minute
  }

  // ============================================================================
  // EDGE GATEWAY MANAGEMENT
  // ============================================================================

  /**
   * Register new edge gateway
   */
  async registerGateway(gatewayData: {
    gatewayId: string;
    homeId: string;
    name: string;
    ipAddress: string;
    hardware: HardwareSpecs;
    capabilities: string[];
  }): Promise<EdgeGateway> {
    this.logger.log(`Registering edge gateway: ${gatewayData.gatewayId}`);

    try {
      const gateway = await this.prisma.edgeGateway.create({
        data: {
          gatewayId: gatewayData.gatewayId,
          homeId: gatewayData.homeId,
          name: gatewayData.name,
          ipAddress: gatewayData.ipAddress,
          status: EdgeGatewayStatus.ONLINE,
          hardware: gatewayData.hardware,
          capabilities: gatewayData.capabilities,
          models: [],
          metrics: this.getDefaultMetrics(),
          lastHeartbeat: new Date(),
          registeredAt: new Date(),
        },
      });

      const edgeGateway: EdgeGateway = {
        gatewayId: gateway.gatewayId,
        homeId: gateway.homeId,
        name: gateway.name,
        ipAddress: gateway.ipAddress,
        status: gateway.status as EdgeGatewayStatus,
        capabilities: gatewayData.capabilities.map(cap => ({
          type: cap,
          enabled: true,
          performance: 100,
          version: '1.0.0',
        })),
        hardware: gateway.hardware as HardwareSpecs,
        models: [],
        metrics: gateway.metrics as EdgeMetrics,
        lastHeartbeat: gateway.lastHeartbeat,
      };

      // Cache gateway
      this.gatewayCache.set(gatewayData.gatewayId, edgeGateway);

      // Initialize queues
      this.inferenceQueues.set(gatewayData.gatewayId, []);
      this.syncQueues.set(gatewayData.gatewayId, []);

      this.logger.log(`Gateway registered successfully: ${gatewayData.gatewayId}`);
      return edgeGateway;
    } catch (error) {
      this.logger.error(`Error registering gateway: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get gateway by ID
   */
  async getGateway(gatewayId: string): Promise<EdgeGateway> {
    // Check cache first
    if (this.gatewayCache.has(gatewayId)) {
      return this.gatewayCache.get(gatewayId);
    }

    const gateway = await this.prisma.edgeGateway.findUnique({
      where: { gatewayId },
    });

    if (!gateway) {
      throw new NotFoundException(`Gateway ${gatewayId} not found`);
    }

    const edgeGateway: EdgeGateway = {
      gatewayId: gateway.gatewayId,
      homeId: gateway.homeId,
      name: gateway.name,
      ipAddress: gateway.ipAddress,
      status: gateway.status as EdgeGatewayStatus,
      capabilities: (gateway.capabilities as string[]).map(cap => ({
        type: cap,
        enabled: true,
        performance: 100,
        version: '1.0.0',
      })),
      hardware: gateway.hardware as HardwareSpecs,
      models: gateway.models as EdgeMLModel[],
      metrics: gateway.metrics as EdgeMetrics,
      lastHeartbeat: gateway.lastHeartbeat,
    };

    this.gatewayCache.set(gatewayId, edgeGateway);
    return edgeGateway;
  }

  /**
   * Get gateways by home
   */
  async getGatewaysByHome(homeId: string): Promise<EdgeGateway[]> {
    const gateways = await this.prisma.edgeGateway.findMany({
      where: { homeId },
      orderBy: { name: 'asc' },
    });

    return gateways.map(g => ({
      gatewayId: g.gatewayId,
      homeId: g.homeId,
      name: g.name,
      ipAddress: g.ipAddress,
      status: g.status as EdgeGatewayStatus,
      capabilities: (g.capabilities as string[]).map(cap => ({
        type: cap,
        enabled: true,
        performance: 100,
        version: '1.0.0',
      })),
      hardware: g.hardware as HardwareSpecs,
      models: g.models as EdgeMLModel[],
      metrics: g.metrics as EdgeMetrics,
      lastHeartbeat: g.lastHeartbeat,
    }));
  }

  /**
   * Update gateway heartbeat
   */
  async updateGatewayHeartbeat(gatewayId: string, metrics: Partial<EdgeMetrics>): Promise<void> {
    const gateway = await this.getGateway(gatewayId);

    const updatedMetrics = {
      ...gateway.metrics,
      ...metrics,
    };

    await this.prisma.edgeGateway.update({
      where: { gatewayId },
      data: {
        lastHeartbeat: new Date(),
        metrics: updatedMetrics,
        status: EdgeGatewayStatus.ONLINE,
      },
    });

    // Update cache
    if (this.gatewayCache.has(gatewayId)) {
      const cached = this.gatewayCache.get(gatewayId);
      cached.lastHeartbeat = new Date();
      cached.metrics = updatedMetrics;
      cached.status = EdgeGatewayStatus.ONLINE;
    }
  }

  /**
   * Check health of all gateways
   */
  private async checkAllGatewayHealth(): Promise<void> {
    const allGateways = await this.prisma.edgeGateway.findMany();

    for (const gateway of allGateways) {
      const timeSinceHeartbeat = Date.now() - gateway.lastHeartbeat.getTime();
      const minutesSinceHeartbeat = timeSinceHeartbeat / (1000 * 60);

      if (minutesSinceHeartbeat > 5 && gateway.status !== EdgeGatewayStatus.OFFLINE) {
        // Mark as offline if no heartbeat in 5 minutes
        await this.prisma.edgeGateway.update({
          where: { gatewayId: gateway.gatewayId },
          data: { status: EdgeGatewayStatus.OFFLINE },
        });

        this.logger.warn(`Gateway ${gateway.gatewayId} marked as OFFLINE`);
      }
    }
  }

  /**
   * Deploy ML model to edge gateway
   */
  async deployModel(gatewayId: string, model: EdgeMLModel, modelData: any): Promise<void> {
    this.logger.log(`Deploying model ${model} to gateway ${gatewayId}`);

    const gateway = await this.getGateway(gatewayId);

    // In production: send model to edge device via API
    // For now, just update database
    const currentModels = gateway.models || [];
    if (!currentModels.includes(model)) {
      currentModels.push(model);

      await this.prisma.edgeGateway.update({
        where: { gatewayId },
        data: { models: currentModels },
      });

      // Update cache
      if (this.gatewayCache.has(gatewayId)) {
        this.gatewayCache.get(gatewayId).models = currentModels;
      }

      this.logger.log(`Model ${model} deployed successfully to gateway ${gatewayId}`);
    }
  }

  // ============================================================================
  // LOCAL ML INFERENCE COORDINATION
  // ============================================================================

  /**
   * Request inference on edge gateway
   */
  async requestInference(request: EdgeInferenceRequest): Promise<EdgeInferenceResult> {
    this.logger.debug(`Inference request: ${request.model} on gateway ${request.gatewayId}`);

    try {
      const gateway = await this.getGateway(request.gatewayId);

      // Check if gateway is online
      if (gateway.status !== EdgeGatewayStatus.ONLINE) {
        throw new Error(`Gateway ${request.gatewayId} is ${gateway.status}`);
      }

      // Check if model is deployed
      if (!gateway.models.includes(request.model)) {
        throw new Error(`Model ${request.model} not deployed on gateway ${request.gatewayId}`);
      }

      const startTime = Date.now();

      // In production: send request to edge device via gRPC/HTTP
      // For now, simulate inference
      const result = await this.simulateEdgeInference(request.model, request.inputData);

      const latency = Date.now() - startTime;

      const inferenceResult: EdgeInferenceResult = {
        requestId: `inf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        model: request.model,
        result,
        confidence: result.confidence || 0.95,
        latency,
        processedAt: new Date(),
        location: 'EDGE',
      };

      // Log inference for monitoring
      await this.logInference(request.gatewayId, inferenceResult);

      return inferenceResult;
    } catch (error) {
      this.logger.error(`Error in edge inference: ${error.message}`, error.stack);

      // Fallback to cloud inference if edge fails
      if (request.priority === 'CRITICAL') {
        this.logger.log('Falling back to cloud inference for critical request');
        return this.fallbackToCloudInference(request);
      }

      throw error;
    }
  }

  /**
   * Simulate edge inference (replace with actual edge API calls)
   */
  private async simulateEdgeInference(model: EdgeMLModel, inputData: any): Promise<any> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 40));

    switch (model) {
      case EdgeMLModel.FALL_DETECTION:
        return {
          fallDetected: false,
          confidence: 0.98,
          bodyAngle: 85,
          velocity: 0.2,
        };

      case EdgeMLModel.ACTIVITY_RECOGNITION:
        return {
          activity: 'WALKING',
          confidence: 0.92,
          duration: 120,
        };

      case EdgeMLModel.GAIT_ANALYSIS:
        return {
          gaitSpeed: 1.2,
          stepLength: 65,
          cadence: 110,
          symmetry: 94,
          stability: 88,
        };

      case EdgeMLModel.VOICE_ANALYSIS:
        return {
          emotion: 'neutral',
          stress_level: 0.3,
          fatigue: 0.2,
          cognitive_load: 0.4,
          confidence: 0.89,
        };

      case EdgeMLModel.ANOMALY_DETECTION:
        return {
          anomalyDetected: false,
          anomalyScore: 0.15,
          anomalyType: null,
          confidence: 0.95,
        };

      default:
        return { processed: true, confidence: 0.9 };
    }
  }

  /**
   * Fallback to cloud inference
   */
  private async fallbackToCloudInference(request: EdgeInferenceRequest): Promise<EdgeInferenceResult> {
    const startTime = Date.now();

    // In production: call cloud ML service
    const result = await this.simulateEdgeInference(request.model, request.inputData);

    return {
      requestId: `cloud-inf-${Date.now()}`,
      model: request.model,
      result,
      confidence: result.confidence || 0.90,
      latency: Date.now() - startTime,
      processedAt: new Date(),
      location: 'CLOUD',
    };
  }

  /**
   * Log inference for monitoring
   */
  private async logInference(gatewayId: string, result: EdgeInferenceResult): Promise<void> {
    try {
      await this.prisma.edgeInference.create({
        data: {
          gatewayId,
          requestId: result.requestId,
          model: result.model,
          result: result.result,
          confidence: result.confidence,
          latency: result.latency,
          location: result.location,
          processedAt: result.processedAt,
        },
      });
    } catch (error) {
      this.logger.error(`Error logging inference: ${error.message}`);
    }
  }

  // ============================================================================
  // DATA AGGREGATION AT EDGE
  // ============================================================================

  /**
   * Aggregate sensor data at edge (reduce bandwidth by 95%)
   */
  async aggregateDataAtEdge(
    gatewayId: string,
    rawData: any[],
    aggregationWindow: number = 60, // seconds
  ): Promise<EdgeDataAggregation> {
    this.logger.debug(`Aggregating ${rawData.length} data points on gateway ${gatewayId}`);

    const startTime = new Date(Date.now() - aggregationWindow * 1000);
    const endTime = new Date();

    // Group data by type
    const dataByType: Record<string, any[]> = {};
    for (const dataPoint of rawData) {
      const type = dataPoint.type || 'unknown';
      if (!dataByType[type]) {
        dataByType[type] = [];
      }
      dataByType[type].push(dataPoint);
    }

    // Aggregate each type
    const aggregatedData: Record<string, any> = {};
    for (const [type, points] of Object.entries(dataByType)) {
      aggregatedData[type] = this.aggregateDataPoints(points);
    }

    // Calculate compression
    const originalSize = JSON.stringify(rawData).length;
    const compressedSize = JSON.stringify(aggregatedData).length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
    const bandwidthSaved = (originalSize - compressedSize) / (1024 * 1024); // MB

    const aggregation: EdgeDataAggregation = {
      startTime,
      endTime,
      dataPoints: rawData.length,
      aggregatedData,
      compression: Math.round(compressionRatio),
      bandwidthSaved: Math.round(bandwidthSaved * 100) / 100,
    };

    this.logger.log(
      `Data aggregation complete: ${rawData.length} points → ${Object.keys(aggregatedData).length} aggregates ` +
      `(${aggregation.compression}% reduction, ${aggregation.bandwidthSaved} MB saved)`
    );

    return aggregation;
  }

  /**
   * Aggregate data points (compute statistics)
   */
  private aggregateDataPoints(points: any[]): any {
    if (points.length === 0) {
      return null;
    }

    // Extract numeric values
    const values = points
      .map(p => typeof p.value === 'number' ? p.value : null)
      .filter(v => v !== null);

    if (values.length === 0) {
      return { count: points.length, samples: points.slice(0, 5) };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate standard deviation
    const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      count: points.length,
      statistics: {
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        avg: Math.round(avg * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
      },
      timestamps: {
        first: points[0].timestamp,
        last: points[points.length - 1].timestamp,
      },
      // Include anomalies (values outside 2 std deviations)
      anomalies: points.filter(p => {
        const val = p.value;
        return typeof val === 'number' && Math.abs(val - avg) > 2 * stdDev;
      }),
    };
  }

  // ============================================================================
  // PRIVACY FILTERING
  // ============================================================================

  /**
   * Apply privacy filters to data (no raw video/audio leaves home)
   */
  async applyPrivacyFilters(
    gatewayId: string,
    data: any,
    dataType: 'VIDEO' | 'AUDIO' | 'SENSOR',
  ): Promise<any> {
    const gateway = await this.getGateway(gatewayId);
    const filters = this.privacyFilters.get(gateway.homeId) || this.privacyFilters.get('default');

    let filteredData = { ...data };

    for (const filter of filters) {
      if (!filter.enabled) continue;

      switch (filter.type) {
        case 'VIDEO_BLUR':
          if (dataType === 'VIDEO') {
            filteredData = this.applyVideoBlur(filteredData, filter.config);
          }
          break;

        case 'AUDIO_MUTE':
          if (dataType === 'AUDIO') {
            filteredData = this.applyAudioMute(filteredData, filter.config);
          }
          break;

        case 'DATA_ANONYMIZE':
          filteredData = this.anonymizeData(filteredData, filter.config);
          break;

        case 'PII_STRIP':
          filteredData = this.stripPII(filteredData);
          break;
      }
    }

    return filteredData;
  }

  /**
   * Apply video blur filter (keep pose data, blur identifying features)
   */
  private applyVideoBlur(videoData: any, config: any): any {
    // In production: use OpenCV or similar to blur faces and PII
    return {
      ...videoData,
      raw_frame: null, // Remove raw video
      pose_landmarks: videoData.pose_landmarks, // Keep skeletal data
      motion_vectors: videoData.motion_vectors, // Keep motion
      scene_metadata: {
        lighting: videoData.lighting,
        objects_detected: videoData.objects_detected?.filter(
          (obj: string) => !['face', 'person_id'].includes(obj)
        ),
      },
      privacy_applied: ['VIDEO_BLUR'],
    };
  }

  /**
   * Apply audio mute filter (keep emotional tone, strip speech)
   */
  private applyAudioMute(audioData: any, config: any): any {
    // In production: use audio processing to extract tone while removing speech
    return {
      ...audioData,
      raw_audio: null, // Remove raw audio
      emotional_tone: audioData.emotional_tone, // Keep emotion
      volume_level: audioData.volume_level, // Keep volume
      frequency_profile: audioData.frequency_profile, // Keep frequency data
      speech_content: null, // Remove speech transcription
      privacy_applied: ['AUDIO_MUTE'],
    };
  }

  /**
   * Anonymize data (hash IDs, remove locations if configured)
   */
  private anonymizeData(data: any, config: any): any {
    const anonymized = { ...data };

    if (config.hashIds && anonymized.userId) {
      anonymized.userId = this.hashId(anonymized.userId);
    }

    if (config.removeLocations) {
      delete anonymized.location;
      delete anonymized.gps;
    }

    return anonymized;
  }

  /**
   * Strip PII from data
   */
  private stripPII(data: any): any {
    const stripped = { ...data };
    const piiFields = ['name', 'email', 'phone', 'address', 'ssn', 'dob'];

    for (const field of piiFields) {
      delete stripped[field];
    }

    return stripped;
  }

  /**
   * Hash ID for anonymization
   */
  private hashId(id: string): string {
    // Simple hash for demo - use crypto.createHash in production
    return `hash_${id.substring(0, 8)}`;
  }

  // ============================================================================
  // OFFLINE OPERATION & STORE-AND-FORWARD
  // ============================================================================

  /**
   * Store data for offline operation
   */
  async storeForOfflineOperation(gatewayId: string, data: any): Promise<void> {
    const syncQueue = this.syncQueues.get(gatewayId) || [];
    syncQueue.push({
      timestamp: new Date(),
      data,
      synced: false,
    });
    this.syncQueues.set(gatewayId, syncQueue);

    this.logger.debug(`Queued data for offline sync on gateway ${gatewayId}`);
  }

  /**
   * Sync queued data when connection restored
   */
  async syncQueuedData(gatewayId: string): Promise<EdgeSyncStatus> {
    this.logger.log(`Starting data sync for gateway ${gatewayId}`);

    const gateway = await this.getGateway(gatewayId);
    const syncQueue = this.syncQueues.get(gatewayId) || [];

    if (syncQueue.length === 0) {
      return {
        gatewayId,
        lastSync: new Date(),
        pendingItems: 0,
        syncInProgress: false,
        queueSize: 0,
        estimatedSyncTime: 0,
      };
    }

    // Calculate queue size
    const queueSize = JSON.stringify(syncQueue).length / (1024 * 1024); // MB

    // Sync items in batches
    const batchSize = 100;
    let syncedCount = 0;

    for (let i = 0; i < syncQueue.length; i += batchSize) {
      const batch = syncQueue.slice(i, i + batchSize);

      try {
        // In production: send batch to cloud API
        await this.processSyncBatch(gatewayId, batch);
        syncedCount += batch.length;

        // Mark as synced
        batch.forEach(item => item.synced = true);
      } catch (error) {
        this.logger.error(`Error syncing batch: ${error.message}`);
        break;
      }
    }

    // Remove synced items
    const remainingQueue = syncQueue.filter(item => !item.synced);
    this.syncQueues.set(gatewayId, remainingQueue);

    this.logger.log(`Synced ${syncedCount} items for gateway ${gatewayId}, ${remainingQueue.length} remaining`);

    return {
      gatewayId,
      lastSync: new Date(),
      pendingItems: remainingQueue.length,
      syncInProgress: false,
      queueSize: JSON.stringify(remainingQueue).length / (1024 * 1024),
      estimatedSyncTime: Math.ceil(remainingQueue.length / 100) * 2, // 2 seconds per batch
    };
  }

  /**
   * Process sync batch
   */
  private async processSyncBatch(gatewayId: string, batch: any[]): Promise<void> {
    // In production: send to cloud storage/database
    // For now, just simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Store in database
    for (const item of batch) {
      try {
        await this.prisma.edgeSyncData.create({
          data: {
            gatewayId,
            data: item.data,
            timestamp: item.timestamp,
            syncedAt: new Date(),
          },
        });
      } catch (error) {
        this.logger.error(`Error storing sync item: ${error.message}`);
      }
    }
  }

  /**
   * Get sync status for gateway
   */
  async getSyncStatus(gatewayId: string): Promise<EdgeSyncStatus> {
    const syncQueue = this.syncQueues.get(gatewayId) || [];
    const queueSize = JSON.stringify(syncQueue).length / (1024 * 1024);

    const lastSync = await this.prisma.edgeSyncData.findFirst({
      where: { gatewayId },
      orderBy: { syncedAt: 'desc' },
    });

    return {
      gatewayId,
      lastSync: lastSync?.syncedAt || new Date(0),
      pendingItems: syncQueue.length,
      syncInProgress: false,
      queueSize,
      estimatedSyncTime: Math.ceil(syncQueue.length / 100) * 2,
    };
  }

  // ============================================================================
  // REAL-TIME PROCESSING COORDINATION
  // ============================================================================

  /**
   * Coordinate real-time processing across edge and cloud
   */
  async coordinateProcessing(
    gatewayId: string,
    mode: ProcessingMode,
    data: any,
  ): Promise<any> {
    const gateway = await this.getGateway(gatewayId);

    switch (mode) {
      case ProcessingMode.EDGE_ONLY:
        // Process entirely on edge
        return this.processOnEdge(gatewayId, data);

      case ProcessingMode.EDGE_FIRST:
        // Try edge first, fallback to cloud
        try {
          return await this.processOnEdge(gatewayId, data);
        } catch (error) {
          this.logger.warn(`Edge processing failed, falling back to cloud: ${error.message}`);
          return this.processOnCloud(data);
        }

      case ProcessingMode.CLOUD_FIRST:
        // Try cloud first, fallback to edge
        try {
          return await this.processOnCloud(data);
        } catch (error) {
          this.logger.warn(`Cloud processing failed, falling back to edge: ${error.message}`);
          return this.processOnEdge(gatewayId, data);
        }

      case ProcessingMode.HYBRID:
        // Process on both and combine results
        const [edgeResult, cloudResult] = await Promise.allSettled([
          this.processOnEdge(gatewayId, data),
          this.processOnCloud(data),
        ]);

        return {
          edge: edgeResult.status === 'fulfilled' ? edgeResult.value : null,
          cloud: cloudResult.status === 'fulfilled' ? cloudResult.value : null,
        };

      default:
        throw new Error(`Unknown processing mode: ${mode}`);
    }
  }

  /**
   * Process data on edge
   */
  private async processOnEdge(gatewayId: string, data: any): Promise<any> {
    // In production: send to edge device for processing
    return {
      processed: true,
      location: 'EDGE',
      result: data,
      latency: 10 + Math.random() * 20,
    };
  }

  /**
   * Process data on cloud
   */
  private async processOnCloud(data: any): Promise<any> {
    // In production: process in cloud infrastructure
    return {
      processed: true,
      location: 'CLOUD',
      result: data,
      latency: 50 + Math.random() * 50,
    };
  }

  // ============================================================================
  // EDGE DEVICE HEALTH MONITORING
  // ============================================================================

  /**
   * Get gateway health metrics
   */
  async getGatewayHealth(gatewayId: string): Promise<any> {
    const gateway = await this.getGateway(gatewayId);
    const metrics = gateway.metrics;

    const health = {
      gatewayId,
      status: gateway.status,
      lastHeartbeat: gateway.lastHeartbeat,
      uptime: this.calculateUptime(gateway.lastHeartbeat),
      metrics: {
        cpu: {
          usage: metrics.cpuUsage,
          status: metrics.cpuUsage > 80 ? 'WARNING' : 'OK',
        },
        memory: {
          usage: metrics.memoryUsage,
          status: metrics.memoryUsage > 85 ? 'WARNING' : 'OK',
        },
        storage: {
          usage: metrics.storageUsage,
          status: metrics.storageUsage > 90 ? 'CRITICAL' : 'OK',
        },
        network: {
          bandwidth: metrics.networkBandwidth,
          status: metrics.networkBandwidth < 1 ? 'WARNING' : 'OK',
        },
        temperature: {
          value: metrics.temperature,
          status: metrics.temperature > 75 ? 'WARNING' : 'OK',
        },
      },
      performance: {
        inferenceLatency: metrics.inferenceLatency,
        throughput: metrics.throughput,
        powerConsumption: metrics.powerConsumption,
      },
      issues: this.identifyHealthIssues(gateway),
    };

    return health;
  }

  private calculateUptime(lastHeartbeat: Date): string {
    const uptimeMs = Date.now() - lastHeartbeat.getTime();
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  private identifyHealthIssues(gateway: EdgeGateway): string[] {
    const issues: string[] = [];
    const metrics = gateway.metrics;

    if (metrics.cpuUsage > 80) issues.push('High CPU usage');
    if (metrics.memoryUsage > 85) issues.push('High memory usage');
    if (metrics.storageUsage > 90) issues.push('Low storage space');
    if (metrics.temperature > 75) issues.push('High temperature');
    if (metrics.networkBandwidth < 1) issues.push('Low bandwidth');
    if (gateway.status !== EdgeGatewayStatus.ONLINE) issues.push('Gateway offline');

    return issues;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getDefaultMetrics(): EdgeMetrics {
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      storageUsage: 0,
      networkBandwidth: 100,
      inferenceLatency: 0,
      throughput: 0,
      powerConsumption: 10,
      temperature: 45,
    };
  }
}
