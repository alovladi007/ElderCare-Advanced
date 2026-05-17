import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ZeroTrustService, AccessRequest, AccessContext } from '../services/zero-trust.service';

export const POLICY_KEY = 'policy';
export const Policy = (action: string, conditions?: any) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    const metadata = { action, conditions };
    if (descriptor) {
      Reflect.defineMetadata(POLICY_KEY, metadata, descriptor.value);
    } else {
      Reflect.defineMetadata(POLICY_KEY, metadata, target);
    }
  };
};

@Injectable()
export class ZeroTrustGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private zeroTrust: ZeroTrustService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get policy metadata from decorator
    const policy = this.reflector.get<{ action: string; conditions?: any }>(
      POLICY_KEY,
      context.getHandler(),
    );

    if (!policy) {
      // No policy defined, allow (could also default to deny)
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Extract user info
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Extract resource info
    const resourceId = request.params.id || request.params.elderId || request.body.elderId;
    const resourceType = this.extractResourceType(request.url);

    // Build access context
    const accessContext: AccessContext = {
      ipAddress: this.getClientIp(request),
      deviceId: request.headers['x-device-id'] || 'unknown',
      deviceFingerprint: request.headers['x-device-fingerprint'] || '',
      location: this.parseLocation(request.headers['x-location']),
      timestamp: new Date(),
      userAgent: request.headers['user-agent'] || '',
    };

    // Build access request
    const accessRequest: AccessRequest = {
      userId: user.id,
      resourceId,
      resourceType,
      action: policy.action,
      context: accessContext,
    };

    // Evaluate access using zero-trust principles
    const decision = await this.zeroTrust.evaluateAccess(accessRequest);

    // Log access attempt
    await this.zeroTrust.logAccess(accessRequest, decision);

    if (!decision.granted) {
      if (decision.mfaRequired) {
        throw new ForbiddenException({
          message: decision.reason,
          mfaRequired: true,
          additionalVerification: decision.additionalVerification,
        });
      }

      throw new ForbiddenException(decision.reason);
    }

    // Attach decision to request for downstream use
    request.accessDecision = decision;

    return true;
  }

  private extractResourceType(url: string): string {
    // Extract resource type from URL pattern
    // e.g., /api/elder/123 -> Elder
    // e.g., /api/vitals/456 -> VitalReading

    if (url.includes('/elder')) return 'Elder';
    if (url.includes('/vitals')) return 'VitalReading';
    if (url.includes('/medications')) return 'Medication';
    if (url.includes('/alerts')) return 'Alert';
    if (url.includes('/appointments')) return 'Appointment';
    if (url.includes('/medical-history')) return 'MedicalHistory';

    return 'Unknown';
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }

  private parseLocation(locationHeader?: string): { latitude: number; longitude: number } | undefined {
    if (!locationHeader) return undefined;

    try {
      const [lat, lon] = locationHeader.split(',').map(Number);
      return { latitude: lat, longitude: lon };
    } catch {
      return undefined;
    }
  }
}
