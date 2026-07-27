/**
 * Integration Tests for API Gateway
 *
 * The gateway proxies to two services that only exist in a full deployment
 * (the legacy Express server and the monitoring backend). Neither is started
 * by CI, so this suite never asserts a successful proxy round-trip. It covers
 * what the gateway does on its own: the service inventory, the health report,
 * the auth boundary on the proxy routes, and the failure path when an upstream
 * cannot be reached.
 *
 * The upstream URLs are pinned at unroutable ports so the result does not
 * depend on whatever happens to be listening on the developer's machine.
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/test-app';

const DEAD_LEGACY_URL = 'http://127.0.0.1:59321';
const DEAD_MONITORING_URL = 'http://127.0.0.1:59322';

describe('API Gateway Integration Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let previousLegacyUrl: string | undefined;
  let previousMonitoringUrl: string | undefined;

  beforeAll(async () => {
    // ApiGatewayService reads these when it is constructed, so they have to be
    // set before the module is compiled.
    previousLegacyUrl = process.env.LEGACY_SERVER_URL;
    previousMonitoringUrl = process.env.MONITORING_SERVER_URL;
    process.env.LEGACY_SERVER_URL = DEAD_LEGACY_URL;
    process.env.MONITORING_SERVER_URL = DEAD_MONITORING_URL;

    app = await createTestApp({ globalPrefix: 'api' });

    // ADMIN is not self-registerable (see src/auth/dto/register.dto.ts) and the
    // proxy routes only require a valid token, not a particular role.
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `gateway${Date.now()}@example.com`,
        password: 'TestPassw0rd123',
        firstName: 'Gateway',
        lastName: 'Test',
        role: 'FAMILY',
      })
      .expect(201);

    authToken = response.body.access_token;
  });

  afterAll(async () => {
    await app.close();

    if (previousLegacyUrl === undefined) {
      delete process.env.LEGACY_SERVER_URL;
    } else {
      process.env.LEGACY_SERVER_URL = previousLegacyUrl;
    }

    if (previousMonitoringUrl === undefined) {
      delete process.env.MONITORING_SERVER_URL;
    } else {
      process.env.MONITORING_SERVER_URL = previousMonitoringUrl;
    }
  });

  describe('GET /api/gateway/health', () => {
    it('should report the gateway up and the downstream services unavailable', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/gateway/health')
        .expect(200);

      expect(response.body.gateway).toBe(true);
      expect(response.body.services).toEqual({
        legacy: false,
        monitoring: false,
      });
    });

    it('should not require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/gateway/health')
        .expect(200);
    });
  });

  describe('GET /api/gateway/routes', () => {
    it('should return the gateway route inventory', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/gateway/routes')
        .expect(200);

      expect(response.body).toHaveProperty('/gateway/health');
      expect(response.body).toHaveProperty('/gateway/legacy/*');
      expect(response.body).toHaveProperty('/gateway/monitoring/*');
      expect(response.body).toHaveProperty('examples');
      expect(response.body.examples).toHaveProperty('legacy_bookings');
      expect(response.body).toHaveProperty('note');
    });
  });

  describe('Gateway Authentication', () => {
    it('should require authentication for legacy proxy', async () => {
      await request(app.getHttpServer())
        .get('/api/gateway/legacy/api/health')
        .expect(401);
    });

    it('should require authentication for monitoring proxy', async () => {
      await request(app.getHttpServer())
        .get('/api/gateway/monitoring/api/health')
        .expect(401);
    });

    it('should reject a malformed token on the proxy routes', async () => {
      await request(app.getHttpServer())
        .get('/api/gateway/legacy/api/health')
        .set('Authorization', 'Bearer not-a-real-token')
        .expect(401);
    });
  });

  describe('Unreachable upstream', () => {
    it('should answer 503 when the legacy service cannot be reached', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/gateway/legacy/api/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(503);

      expect(JSON.stringify(response.body)).toContain(DEAD_LEGACY_URL);
    });

    it('should answer 503 when the monitoring service cannot be reached', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/gateway/monitoring/api/auth/login')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'someone@example.com', password: 'TestPassw0rd123' })
        .expect(503);

      expect(JSON.stringify(response.body)).toContain(DEAD_MONITORING_URL);
    });
  });

  // SKIPPED - needs the legacy Express service (LEGACY_SERVER_URL, port 5000 by
  // default) actually running; CI does not start it.
  it.skip('should return the legacy service payload when it is running', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/gateway/legacy/api/health')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toBeDefined();
  });

  // SKIPPED - needs the monitoring backend (MONITORING_SERVER_URL, port 5001 by
  // default) actually running; CI does not start it.
  it.skip('should return the monitoring service payload when it is running', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/gateway/monitoring/api/health')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toBeDefined();
  });
});
