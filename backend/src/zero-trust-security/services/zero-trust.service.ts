import { Injectable, Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as crypto from 'crypto';

export interface AccessRequest {
  userId: string;
  resourceId: string;
  resourceType: string;
  action: string;
  context: AccessContext;
}

export interface AccessContext {
  ipAddress: string;
  deviceId: string;
  deviceFingerprint: string;
  location?: { latitude: number; longitude: number };
  timestamp: Date;
  userAgent: string;
}

export interface AccessDecision {
  granted: boolean;
  reason: string;
  restrictions?: string[];
  mfaRequired?: boolean;
  additionalVerification?: string[];
}

export interface SecurityPolicy {
  id: string;
  name: string;
  resourceType: string;
  conditions: PolicyCondition[];
  actions: string[];
  effect: 'ALLOW' | 'DENY';
  priority: number;
}

export interface PolicyCondition {
  type: 'ROLE' | 'TIME' | 'LOCATION' | 'DEVICE' | 'NETWORK' | 'RISK_SCORE';
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'IN_RANGE' | 'GREATER_THAN' | 'LESS_THAN';
  value: any;
}

export interface RiskAssessment {
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: RiskFactor[];
  requiresAdditionalAuth: boolean;
}

export interface RiskFactor {
  factor: string;
  impact: number;
  description: string;
}

@Injectable()
export class ZeroTrustService {
  private readonly logger = new Logger(ZeroTrustService.name);
  private readonly policies: Map<string, SecurityPolicy> = new Map();
  private readonly trustedDevices: Map<string, Date> = new Map();
  private readonly suspiciousIPs: Set<string> = new Set();

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.initializeDefaultPolicies();
  }

  /**
   * Evaluate access request using zero-trust principles
   */
  async evaluateAccess(request: AccessRequest): Promise<AccessDecision> {
    this.logger.log(`Evaluating access: ${request.userId} -> ${request.resourceType}:${request.resourceId} (${request.action})`);

    try {
      // Step 1: Authenticate identity (already done by auth middleware)
      // Step 2: Assess risk
      const riskAssessment = await this.assessRisk(request);

      // Step 3: Check authorization policies
      const policyDecision = await this.evaluatePolicies(request);

      // Step 4: Verify device security posture
      const deviceCheck = await this.verifyDeviceSecurity(request.context.deviceId);

      // Step 5: Check contextual factors
      const contextCheck = await this.verifyContext(request);

      // Step 6: Make final decision
      return this.makeFinalDecision(request, riskAssessment, policyDecision, deviceCheck, contextCheck);
    } catch (error) {
      this.logger.error(`Access evaluation error: ${error.message}`, error.stack);

      // Default deny on error
      return {
        granted: false,
        reason: 'Access evaluation failed - denied by default',
      };
    }
  }

  /**
   * Assess risk level for access request
   */
  async assessRisk(request: AccessRequest): Promise<RiskAssessment> {
    const factors: RiskFactor[] = [];
    let riskScore = 0;

    // Check IP reputation
    if (this.suspiciousIPs.has(request.context.ipAddress)) {
      riskScore += 30;
      factors.push({
        factor: 'Suspicious IP',
        impact: 30,
        description: 'IP address has been flagged for suspicious activity',
      });
    }

    // Check device trust
    if (!this.trustedDevices.has(request.context.deviceId)) {
      riskScore += 20;
      factors.push({
        factor: 'Unknown Device',
        impact: 20,
        description: 'Device is not recognized or trusted',
      });
    }

    // Check location anomaly
    const locationRisk = await this.checkLocationAnomaly(request.userId, request.context.location);
    if (locationRisk > 0) {
      riskScore += locationRisk;
      factors.push({
        factor: 'Location Anomaly',
        impact: locationRisk,
        description: 'Access from unusual location',
      });
    }

    // Check time anomaly
    const timeRisk = this.checkTimeAnomaly(request);
    if (timeRisk > 0) {
      riskScore += timeRisk;
      factors.push({
        factor: 'Time Anomaly',
        impact: timeRisk,
        description: 'Access at unusual time',
      });
    }

    // Check failed login attempts
    const loginRisk = await this.checkFailedLogins(request.userId, request.context.ipAddress);
    if (loginRisk > 0) {
      riskScore += loginRisk;
      factors.push({
        factor: 'Failed Logins',
        impact: loginRisk,
        description: 'Recent failed login attempts detected',
      });
    }

    // Check resource sensitivity
    const sensitivityRisk = this.checkResourceSensitivity(request.resourceType);
    riskScore += sensitivityRisk;

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (riskScore >= 75) riskLevel = 'CRITICAL';
    else if (riskScore >= 50) riskLevel = 'HIGH';
    else if (riskScore >= 25) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';

    return {
      riskScore,
      riskLevel,
      factors,
      requiresAdditionalAuth: riskScore >= 50,
    };
  }

  /**
   * Evaluate security policies
   */
  async evaluatePolicies(request: AccessRequest): Promise<{ allowed: boolean; matchedPolicies: string[] }> {
    const matchedPolicies: string[] = [];
    let finalDecision = false; // Deny by default

    // Get applicable policies (sorted by priority)
    const policies = Array.from(this.policies.values())
      .filter(p => p.resourceType === request.resourceType || p.resourceType === '*')
      .sort((a, b) => b.priority - a.priority);

    for (const policy of policies) {
      // Check if all conditions match
      const conditionsMatch = await this.evaluateConditions(policy.conditions, request);

      if (conditionsMatch && policy.actions.includes(request.action)) {
        matchedPolicies.push(policy.id);

        if (policy.effect === 'DENY') {
          // Explicit deny always wins
          return { allowed: false, matchedPolicies };
        } else if (policy.effect === 'ALLOW') {
          finalDecision = true;
        }
      }
    }

    return { allowed: finalDecision, matchedPolicies };
  }

  /**
   * Verify device security posture
   */
  async verifyDeviceSecurity(deviceId: string): Promise<{ secure: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check if device is registered
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });

    if (!device) {
      issues.push('Device not registered');
      return { secure: false, issues };
    }

    // Check device health
    if (device.status !== 'ONLINE') {
      issues.push('Device offline or unavailable');
    }

    // Check if device meets security requirements
    // (e.g., encryption enabled, OS updated, antivirus active)
    const securityRequirements = await this.checkDeviceSecurityRequirements(device);
    if (!securityRequirements.passed) {
      issues.push(...securityRequirements.failures);
    }

    return { secure: issues.length === 0, issues };
  }

  /**
   * Verify access context (time, location, network)
   */
  async verifyContext(request: AccessRequest): Promise<{ valid: boolean; warnings: string[] }> {
    const warnings: string[] = [];

    // Check if access is within allowed time window
    const currentHour = new Date().getHours();
    if (currentHour < 6 || currentHour > 22) {
      warnings.push('Access outside normal hours');
    }

    // Check if location is within allowed geographic boundaries
    if (request.context.location) {
      const locationAllowed = await this.checkLocationAllowed(request.userId, request.context.location);
      if (!locationAllowed) {
        warnings.push('Access from restricted location');
      }
    }

    // Check network security (e.g., not using public WiFi)
    const networkCheck = this.checkNetworkSecurity(request.context.ipAddress);
    if (!networkCheck.secure) {
      warnings.push(networkCheck.warning);
    }

    return { valid: warnings.length === 0, warnings };
  }

  /**
   * Make final access decision combining all factors
   */
  private makeFinalDecision(
    request: AccessRequest,
    risk: RiskAssessment,
    policy: { allowed: boolean; matchedPolicies: string[] },
    device: { secure: boolean; issues: string[] },
    context: { valid: boolean; warnings: string[] }
  ): AccessDecision {
    // Deny if policy explicitly denies
    if (!policy.allowed) {
      return {
        granted: false,
        reason: 'Access denied by security policy',
      };
    }

    // Deny if device is not secure
    if (!device.secure) {
      return {
        granted: false,
        reason: `Device security issues: ${device.issues.join(', ')}`,
      };
    }

    // Require MFA for high/critical risk
    if (risk.riskLevel === 'HIGH' || risk.riskLevel === 'CRITICAL') {
      return {
        granted: false,
        reason: 'Additional authentication required',
        mfaRequired: true,
        additionalVerification: ['SMS', 'Authenticator App', 'Biometric'],
      };
    }

    // Grant with restrictions for medium risk
    if (risk.riskLevel === 'MEDIUM') {
      return {
        granted: true,
        reason: 'Access granted with restrictions',
        restrictions: [
          'Read-only access',
          'Limited time window: 1 hour',
          'Actions will be logged and monitored',
        ],
      };
    }

    // Grant full access for low risk
    return {
      granted: true,
      reason: 'Access granted',
    };
  }

  // ============================================
  // PRIVATE METHODS - Risk Assessment
  // ============================================

  private async checkLocationAnomaly(userId: string, location?: { latitude: number; longitude: number }): Promise<number> {
    if (!location) return 0;

    // Get user's typical locations
    const recentAccess = await this.prisma.accessLog.findMany({
      where: {
        userId,
        timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      take: 100,
    });

    if (recentAccess.length === 0) return 0;

    // Calculate if location is significantly different from usual
    const typicalLocations = recentAccess
      .filter(log => log.location)
      .map(log => log.location as { latitude: number; longitude: number });

    for (const typical of typicalLocations) {
      const distance = this.calculateDistance(location, typical);
      if (distance < 100) { // Within 100 km
        return 0; // Not anomalous
      }
    }

    return 25; // Anomalous location
  }

  private checkTimeAnomaly(request: AccessRequest): number {
    const hour = request.context.timestamp.getHours();

    // Unusual access times (1 AM - 5 AM)
    if (hour >= 1 && hour < 5) {
      return 15;
    }

    return 0;
  }

  private async checkFailedLogins(userId: string, ipAddress: string): Promise<number> {
    const recentFailures = await this.prisma.authAttempt.count({
      where: {
        userId,
        ipAddress,
        success: false,
        timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
      },
    });

    if (recentFailures >= 5) return 30;
    if (recentFailures >= 3) return 15;
    return 0;
  }

  private checkResourceSensitivity(resourceType: string): number {
    const sensitivityMap: Record<string, number> = {
      'Elder': 20,
      'VitalReading': 15,
      'MedicationLog': 15,
      'MedicalHistory': 20,
      'EmergencyContact': 10,
      'HealthcareProvider': 10,
      'PaymentMethod': 25,
    };

    return sensitivityMap[resourceType] || 5;
  }

  // ============================================
  // PRIVATE METHODS - Policy Evaluation
  // ============================================

  private async evaluateConditions(conditions: PolicyCondition[], request: AccessRequest): Promise<boolean> {
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, request);
      if (!result) return false;
    }
    return true;
  }

  private async evaluateCondition(condition: PolicyCondition, request: AccessRequest): Promise<boolean> {
    switch (condition.type) {
      case 'ROLE':
        return this.evaluateRoleCondition(condition, request.userId);
      case 'TIME':
        return this.evaluateTimeCondition(condition, request.context.timestamp);
      case 'LOCATION':
        return this.evaluateLocationCondition(condition, request.context.location);
      case 'DEVICE':
        return this.evaluateDeviceCondition(condition, request.context.deviceId);
      case 'NETWORK':
        return this.evaluateNetworkCondition(condition, request.context.ipAddress);
      case 'RISK_SCORE':
        const risk = await this.assessRisk(request);
        return this.compareValues(risk.riskScore, condition.operator, condition.value);
      default:
        return false;
    }
  }

  private async evaluateRoleCondition(condition: PolicyCondition, userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) return false;

    const userRoles = user.roles.map(r => r.role);

    if (condition.operator === 'EQUALS') {
      return userRoles.includes(condition.value);
    } else if (condition.operator === 'CONTAINS') {
      return condition.value.some(role => userRoles.includes(role));
    }

    return false;
  }

  private evaluateTimeCondition(condition: PolicyCondition, timestamp: Date): boolean {
    const hour = timestamp.getHours();

    if (condition.operator === 'IN_RANGE') {
      const [start, end] = condition.value;
      return hour >= start && hour <= end;
    }

    return false;
  }

  private evaluateLocationCondition(condition: PolicyCondition, location?: { latitude: number; longitude: number }): boolean {
    if (!location) return false;

    // Check if within allowed geographic area
    if (condition.operator === 'IN_RANGE') {
      const { center, radiusKm } = condition.value;
      const distance = this.calculateDistance(location, center);
      return distance <= radiusKm;
    }

    return false;
  }

  private async evaluateDeviceCondition(condition: PolicyCondition, deviceId: string): Promise<boolean> {
    if (condition.operator === 'EQUALS') {
      return this.trustedDevices.has(deviceId);
    }

    return false;
  }

  private evaluateNetworkCondition(condition: PolicyCondition, ipAddress: string): boolean {
    if (condition.operator === 'NOT_EQUALS') {
      return !this.suspiciousIPs.has(ipAddress);
    }

    return false;
  }

  private compareValues(actual: number, operator: string, expected: number): boolean {
    switch (operator) {
      case 'EQUALS': return actual === expected;
      case 'GREATER_THAN': return actual > expected;
      case 'LESS_THAN': return actual < expected;
      default: return false;
    }
  }

  // ============================================
  // PRIVATE METHODS - Device & Network Checks
  // ============================================

  private async checkDeviceSecurityRequirements(device: any): Promise<{ passed: boolean; failures: string[] }> {
    const failures: string[] = [];

    // Check encryption
    if (!device.encryptionEnabled) {
      failures.push('Device encryption not enabled');
    }

    // Check last security update
    if (device.lastSecurityUpdate) {
      const daysSinceUpdate = (Date.now() - device.lastSecurityUpdate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 90) {
        failures.push('Device security updates outdated');
      }
    }

    return { passed: failures.length === 0, failures };
  }

  private async checkLocationAllowed(userId: string, location: { latitude: number; longitude: number }): Promise<boolean> {
    // Check if location is within user's allowed regions
    // For now, allow all (would implement geofencing in production)
    return true;
  }

  private checkNetworkSecurity(ipAddress: string): { secure: boolean; warning?: string } {
    // Check if IP is from known secure network
    // This is simplified - would integrate with threat intelligence feeds

    if (this.suspiciousIPs.has(ipAddress)) {
      return { secure: false, warning: 'IP address flagged as suspicious' };
    }

    return { secure: true };
  }

  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    // Haversine formula for calculating distance between coordinates
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) *
        Math.cos(this.toRadians(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // ============================================
  // PRIVATE METHODS - Policy Management
  // ============================================

  private initializeDefaultPolicies() {
    // Policy 1: Family members can view elder data
    this.policies.set('family-view-elder', {
      id: 'family-view-elder',
      name: 'Family View Elder Data',
      resourceType: 'Elder',
      conditions: [
        { type: 'ROLE', operator: 'EQUALS', value: 'FAMILY_MEMBER' },
        { type: 'TIME', operator: 'IN_RANGE', value: [6, 22] }, // 6 AM - 10 PM
      ],
      actions: ['READ'],
      effect: 'ALLOW',
      priority: 100,
    });

    // Policy 2: Healthcare providers have full access
    this.policies.set('healthcare-full-access', {
      id: 'healthcare-full-access',
      name: 'Healthcare Provider Full Access',
      resourceType: '*',
      conditions: [
        { type: 'ROLE', operator: 'EQUALS', value: 'HEALTHCARE_PROVIDER' },
      ],
      actions: ['READ', 'WRITE', 'UPDATE'],
      effect: 'ALLOW',
      priority: 200,
    });

    // Policy 3: Deny high-risk access
    this.policies.set('deny-high-risk', {
      id: 'deny-high-risk',
      name: 'Deny High Risk Access',
      resourceType: '*',
      conditions: [
        { type: 'RISK_SCORE', operator: 'GREATER_THAN', value: 75 },
      ],
      actions: ['*'],
      effect: 'DENY',
      priority: 1000, // Highest priority
    });

    this.logger.log(`Initialized ${this.policies.size} default security policies`);
  }

  /**
   * Add new security policy
   */
  addPolicy(policy: SecurityPolicy): void {
    this.policies.set(policy.id, policy);
    this.logger.log(`Added security policy: ${policy.name}`);
  }

  /**
   * Remove security policy
   */
  removePolicy(policyId: string): void {
    this.policies.delete(policyId);
    this.logger.log(`Removed security policy: ${policyId}`);
  }

  /**
   * Mark device as trusted
   */
  trustDevice(deviceId: string): void {
    this.trustedDevices.set(deviceId, new Date());
    this.logger.log(`Device trusted: ${deviceId}`);
  }

  /**
   * Flag IP as suspicious
   */
  flagSuspiciousIP(ipAddress: string): void {
    this.suspiciousIPs.add(ipAddress);
    this.logger.warn(`IP flagged as suspicious: ${ipAddress}`);
  }

  /**
   * Log access attempt
   */
  async logAccess(request: AccessRequest, decision: AccessDecision): Promise<void> {
    try {
      await this.prisma.accessLog.create({
        data: {
          userId: request.userId,
          resourceId: request.resourceId,
          resourceType: request.resourceType,
          action: request.action,
          granted: decision.granted,
          reason: decision.reason,
          ipAddress: request.context.ipAddress,
          deviceId: request.context.deviceId,
          location: request.context.location,
          timestamp: request.context.timestamp,
          userAgent: request.context.userAgent,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log access: ${error.message}`);
    }
  }
}
