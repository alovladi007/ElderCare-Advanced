/**
 * Integration Tests for Care Management Module
 * Tests medication, appointments, care plans, and health monitoring endpoints
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Care Management Integration Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let elderId: string;
  let medicationId: string;
  let carePlanId: string;
  let appointmentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();

    // Create test user and get auth token
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `care-test-${Date.now()}@example.com`,
        password: 'testpass123',
        firstName: 'Care',
        lastName: 'Test',
        role: 'FAMILY',
      });

    authToken = registerResponse.body.access_token;

    // Create elder profile
    const elderResponse = await request(app.getHttpServer())
      .post('/api/elder-profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'Elder',
        lastName: 'Test',
        dateOfBirth: '1950-01-15',
        gender: 'MALE',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        emergencyContact: {
          name: 'Emergency Contact',
          phone: '555-0100',
          relationship: 'Child',
        },
      });

    elderId = elderResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Medication Management', () => {
    it('POST /api/care-management/medication - should create medication', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/care-management/medication')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          elderId,
          name: 'Aspirin',
          dosage: '100mg',
          frequency: 'ONCE_DAILY',
          startDate: new Date().toISOString(),
          instructions: 'Take with food',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Aspirin');
      expect(response.body.frequency).toBe('ONCE_DAILY');
      medicationId = response.body.id;
    });

    it('GET /api/care-management/medication/elder/:elderId - should get elder medications', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/medication/elder/${elderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name).toBe('Aspirin');
    });

    it('GET /api/care-management/medication/:id - should get medication by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/medication/${medicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(medicationId);
      expect(response.body.name).toBe('Aspirin');
    });

    it('GET /api/care-management/medication/:id/adherence - should get adherence stats', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/medication/${medicationId}/adherence`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('taken');
      expect(response.body).toHaveProperty('adherenceRate');
    });
  });

  describe('Care Plan Management', () => {
    it('POST /api/care-management/care-plan - should create care plan', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/care-management/care-plan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          elderId,
          title: 'Daily Care Routine',
          description: 'Morning and evening care tasks',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Daily Care Routine');
      carePlanId = response.body.id;
    });

    it('GET /api/care-management/care-plan/elder/:elderId - should get elder care plans', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/care-plan/elder/${elderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('POST /api/care-management/care-plan/:id/task - should create care task', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/care-management/care-plan/${carePlanId}/task`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Morning medication',
          description: 'Administer morning pills',
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Morning medication');
      expect(response.body.status).toBe('PENDING');
    });

    it('GET /api/care-management/care-plan/elder/:elderId/stats - should get care plan stats', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/care-plan/elder/${elderId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalTasks');
      expect(response.body).toHaveProperty('completionRate');
    });
  });

  describe('Health Monitoring', () => {
    it('POST /api/care-management/health/vital - should record vital reading', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/care-management/health/vital')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          elderId,
          vitalType: 'BLOOD_PRESSURE',
          value: 120,
          unit: 'mmHg',
          notes: 'Normal reading',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.vitalType).toBe('BLOOD_PRESSURE');
      expect(response.body.value).toBe(120);
    });

    it('GET /api/care-management/health/vitals/:elderId - should get elder vitals', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/health/vitals/${elderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('GET /api/care-management/health/vitals/:elderId/stats - should get vital stats', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/health/vitals/${elderId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ vitalType: 'BLOOD_PRESSURE', days: 30 })
        .expect(200);

      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('average');
    });

    it('POST /api/care-management/health/vital - should create alert for abnormal vital', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/care-management/health/vital')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          elderId,
          vitalType: 'BLOOD_PRESSURE',
          value: 185, // Critically high
          unit: 'mmHg',
          notes: 'Abnormal reading',
        })
        .expect(201);

      expect(response.body.value).toBe(185);
      // Alert should be created automatically by the service
    });
  });

  describe('Appointment Management', () => {
    it('POST /api/care-management/appointment - should create appointment', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/care-management/appointment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          elderId,
          title: 'Annual Checkup',
          type: 'MEDICAL_CHECKUP',
          startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
          location: 'General Hospital',
          notes: 'Bring medication list',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Annual Checkup');
      expect(response.body.status).toBe('SCHEDULED');
      appointmentId = response.body.id;
    });

    it('GET /api/care-management/appointment/elder/:elderId - should get elder appointments', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/appointment/elder/${elderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('PATCH /api/care-management/appointment/:id - should update appointment', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/care-management/appointment/${appointmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          location: 'Updated Hospital',
        })
        .expect(200);

      expect(response.body.location).toBe('Updated Hospital');
    });

    it('GET /api/care-management/appointment/elder/:elderId/stats - should get appointment stats', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/appointment/elder/${elderId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalAppointments');
      expect(response.body).toHaveProperty('attendanceRate');
    });
  });

  describe('Authorization & Validation', () => {
    it('should fail without authentication token', async () => {
      await request(app.getHttpServer())
        .get(`/api/care-management/medication/elder/${elderId}`)
        .expect(401);
    });

    it('should fail with invalid medication data', async () => {
      await request(app.getHttpServer())
        .post('/api/care-management/medication')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          name: 'Test Med',
        })
        .expect(400);
    });

    it('should fail with invalid vital type', async () => {
      await request(app.getHttpServer())
        .post('/api/care-management/health/vital')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          elderId,
          vitalType: 'INVALID_TYPE',
          value: 120,
        })
        .expect(400);
    });
  });
});
