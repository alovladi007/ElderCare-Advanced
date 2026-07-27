/**
 * Integration Tests for API Gateway
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/test-app';

describe('API Gateway Integration Tests', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();

    // Create and login test user
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `gateway${Date.now()}@example.com`,
        password: 'TestPassw0rd123',
        firstName: 'Gateway',
        lastName: 'Test',
        role: 'ADMIN',
      });

    authToken = response.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /gateway/health', () => {
    it('should return health status of all services', async () => {
      const response = await request(app.getHttpServer())
        .get('/gateway/health')
        .expect(200);

      expect(response.body).toHaveProperty('gateway');
      expect(response.body).toHaveProperty('services');
      expect(response.body.gateway).toBe(true);
      expect(response.body.services).toHaveProperty('legacy');
      expect(response.body.services).toHaveProperty('monitoring');
    });
  });

  describe('GET /gateway/routes', () => {
    it('should return available gateway routes', async () => {
      const response = await request(app.getHttpServer())
        .get('/gateway/routes')
        .expect(200);

      expect(response.body).toHaveProperty('/gateway/health');
      expect(response.body).toHaveProperty('/gateway/legacy/*');
      expect(response.body).toHaveProperty('/gateway/monitoring/*');
      expect(response.body).toHaveProperty('examples');
      expect(response.body).toHaveProperty('note');
    });
  });

  describe('Gateway Authentication', () => {
    it('should require authentication for legacy proxy', async () => {
      await request(app.getHttpServer())
        .get('/gateway/legacy/api/health')
        .expect(401);
    });

    it('should require authentication for monitoring proxy', async () => {
      await request(app.getHttpServer())
        .get('/gateway/monitoring/api/health')
        .expect(401);
    });

    it('should allow authenticated requests to legacy service', async () => {
      // This will fail if legacy server is not running, which is expected in test
      const response = await request(app.getHttpServer())
        .get('/gateway/legacy/api/health')
        .set('Authorization', `Bearer ${authToken}`);

      // Either success (200) or service unavailable (503)
      expect([200, 503]).toContain(response.status);
    });

    it('should allow authenticated requests to monitoring service', async () => {
      // This will fail if monitoring server is not running, which is expected in test
      const response = await request(app.getHttpServer())
        .get('/gateway/monitoring/api/health')
        .set('Authorization', `Bearer ${authToken}`);

      // Either success (200) or service unavailable (503)
      expect([200, 503]).toContain(response.status);
    });
  });
});
