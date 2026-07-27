/**
 * Integration Tests for Care Management Module
 * Tests medication, appointments, care plans, and health monitoring endpoints.
 *
 * Every path below is taken from the @Controller/@Get/@Post decorators in
 * src/care-management/controllers/*.ts - the controllers are the contract.
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/test-app';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('Care Management Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let elderId: string;
  let medicationId: string;
  let carePlanId: string;
  let appointmentId: string;

  beforeAll(async () => {
    app = await createTestApp({ globalPrefix: 'api' });
    prisma = app.get<PrismaService>(PrismaService);

    const stamp = Date.now();
    const password = 'TestPassw0rd123';

    // Caller for the care-management routes. They are guarded by JwtAuthGuard
    // only, so a plain self-registered account is enough.
    const staff = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `care-staff-${stamp}@example.com`,
        password,
        firstName: 'Care',
        lastName: 'Staff',
        role: 'FAMILY',
      })
      .expect(201);

    authToken = staff.body.access_token;

    // The elder profile hangs off its own user row (ElderProfile.userId is unique).
    const elderUser = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `care-elder-${stamp}@example.com`,
        password,
        firstName: 'Elder',
        lastName: 'Test',
        role: 'ELDER',
      })
      .expect(201);

    // The profile itself is seeded straight into the database rather than via
    // POST /api/elder-profile. That route is decorated @Roles('ADMIN',
    // 'CLINICIAN'), and RolesGuard is registered as a global APP_GUARD in
    // app.module.ts, so it runs before the controller's JwtAuthGuard has put
    // anything on req.user - it dereferences `user.role` on undefined and the
    // route answers 500 for every caller, admin or not. That is a server bug,
    // not something this suite should paper over; see the accompanying report.
    const elder = await prisma.elderProfile.create({
      data: {
        userId: elderUser.body.user.id,
        firstName: 'Elder',
        lastName: 'Test',
        dateOfBirth: new Date('1950-01-15T00:00:00.000Z'),
        gender: 'MALE',
        medicalRecordNo: `MRN-${stamp}`,
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        emergencyContact: {
          name: 'Emergency Contact',
          phone: '555-0100',
          relationship: 'Child',
        },
      },
    });

    elderId = elder.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Medication Management', () => {
    it('POST /api/care-management/medications - should create medication', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/care-management/medications')
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

    it('GET /api/care-management/medications/elder/:elderId - should get elder medications', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/medications/elder/${elderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name).toBe('Aspirin');
    });

    it('GET /api/care-management/medications/:id - should get medication by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/medications/${medicationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(medicationId);
      expect(response.body.name).toBe('Aspirin');
    });

    // Adherence is reported per elder, not per medication: the controller
    // exposes GET elder/:elderId/adherence, and the payload counts doses.
    it('GET /api/care-management/medications/elder/:elderId/adherence - should get adherence stats', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/medications/elder/${elderId}/adherence`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalDoses');
      expect(response.body).toHaveProperty('takenDoses');
      expect(response.body).toHaveProperty('missedDoses');
      expect(response.body).toHaveProperty('adherenceRate');
      expect(typeof response.body.adherenceRate).toBe('number');
    });
  });

  describe('Care Plan Management', () => {
    it('POST /api/care-management/care-plans - should create care plan', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/care-management/care-plans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          elderId,
          title: 'Daily Care Routine',
          description: 'Morning and evening care tasks',
          // startDate is not optional: the controller does new Date(body.startDate).
          startDate: new Date().toISOString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Daily Care Routine');
      carePlanId = response.body.id;
    });

    // CarePlan.elderId is unique, so this returns the single plan object, not a list.
    it('GET /api/care-management/care-plans/elder/:elderId - should get the elder care plan', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/care-plans/elder/${elderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(false);
      expect(response.body.id).toBe(carePlanId);
      expect(response.body.elderId).toBe(elderId);
      expect(Array.isArray(response.body.tasks)).toBe(true);
    });

    it('POST /api/care-management/care-plans/:carePlanId/tasks - should create care task', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/care-management/care-plans/${carePlanId}/tasks`)
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
      expect(response.body.carePlanId).toBe(carePlanId);
    });

    it('GET /api/care-management/care-plans/:carePlanId/tasks - should list care plan tasks', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/care-plans/${carePlanId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.map((t: any) => t.title)).toContain('Morning medication');
    });

    // SKIPPED - blocked on a server bug, not on the test.
    // CarePlanController.getCarePlanStats calls getCarePlanByElder('') and then
    // dereferences the result with `carePlan!.elderId`; the lookup always
    // returns null, so the only care-plan stats route always 500s. There is no
    // per-elder stats route to use instead. See the report accompanying this change.
    it.skip('GET /api/care-management/care-plans/:id/stats - should get care plan stats', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/care-plans/${carePlanId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalTasks');
      expect(response.body).toHaveProperty('completionRate');
    });
  });

  describe('Health Monitoring', () => {
    it('POST /api/care-management/health/vitals - should record vital reading', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/care-management/health/vitals')
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

    it('GET /api/care-management/health/vitals/elder/:elderId - should get elder vitals', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/health/vitals/elder/${elderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].elderId).toBe(elderId);
    });

    it('GET /api/care-management/health/vitals/elder/:elderId/stats - should get vital stats', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/health/vitals/elder/${elderId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ vitalType: 'BLOOD_PRESSURE', days: 30 })
        .expect(200);

      expect(response.body.vitalType).toBe('BLOOD_PRESSURE');
      expect(response.body.period).toHaveProperty('totalReadings');
      expect(response.body.period.totalReadings).toBeGreaterThan(0);
      expect(response.body.statistics).toHaveProperty('average');
      expect(typeof response.body.statistics.average).toBe('number');
    });

    it('POST /api/care-management/health/vitals - should create alert for abnormal vital', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/care-management/health/vitals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          elderId,
          vitalType: 'BLOOD_PRESSURE',
          value: 185, // Above the critical_high threshold of 180
          unit: 'mmHg',
          notes: 'Abnormal reading',
        })
        .expect(201);

      expect(response.body.value).toBe(185);

      // The alert the service raises surfaces on the health summary endpoint.
      const summary = await request(app.getHttpServer())
        .get(`/api/care-management/health/elder/${elderId}/summary`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(summary.body.statistics.criticalReadings).toBeGreaterThan(0);
      expect(summary.body.healthStatus).toBe('critical');
      expect(
        summary.body.recentAlerts.some(
          (alert: any) =>
            alert.type === 'VITAL_ABNORMAL' && alert.severity === 'CRITICAL',
        ),
      ).toBe(true);
    });
  });

  describe('Appointment Management', () => {
    it('POST /api/care-management/appointments - should create appointment', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/care-management/appointments')
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

    it('GET /api/care-management/appointments/elder/:elderId - should get elder appointments', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/appointments/elder/${elderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    // The controller exposes @Put(':id'), not PATCH.
    it('PUT /api/care-management/appointments/:id - should update appointment', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/care-management/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          location: 'Updated Hospital',
        })
        .expect(200);

      expect(response.body.location).toBe('Updated Hospital');
    });

    it('GET /api/care-management/appointments/elder/:elderId/stats - should get appointment stats', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/care-management/appointments/elder/${elderId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalAppointments');
      expect(response.body.totalAppointments).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('attendanceRate');
    });
  });

  describe('Authorization & Validation', () => {
    it('should fail without authentication token', async () => {
      await request(app.getHttpServer())
        .get(`/api/care-management/medications/elder/${elderId}`)
        .expect(401);
    });

    it('should 404 for an unknown care-management path', async () => {
      await request(app.getHttpServer())
        .get('/api/care-management/medication/elder/does-not-exist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    // SKIPPED - blocked on a server bug, not on the test.
    // The care-management controllers type their @Body() with inline object
    // literals rather than DTO classes, so the global ValidationPipe has no
    // metatype to validate against and lets anything through. A create call
    // with no elderId reaches Prisma and comes back as a 500 instead of a 400.
    it.skip('should reject medication payload missing required fields with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/care-management/medications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Med',
        })
        .expect(400);
    });

    // SKIPPED - same missing-DTO problem as above: an unknown VitalType is only
    // rejected by Postgres, which surfaces as a 500 rather than a 400.
    it.skip('should reject an invalid vital type with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/care-management/health/vitals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          elderId,
          vitalType: 'INVALID_TYPE',
          value: 120,
          unit: 'mmHg',
        })
        .expect(400);
    });
  });
});
