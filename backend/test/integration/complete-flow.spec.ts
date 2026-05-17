import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('Complete User Flow Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let elderId: string;
  let homeId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Authentication Flow', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@integration.com',
          password: 'Test123!@#',
          firstName: 'Integration',
          lastName: 'Test',
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      authToken = response.body.token;
      userId = response.body.user.id;
    });

    it('should login with credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@integration.com',
          password: 'Test123!@#',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      authToken = response.body.token;
    });

    it('should get current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.email).toBe('test@integration.com');
    });
  });

  describe('2. Elder Profile Management', () => {
    it('should create elder profile', async () => {
      const response = await request(app.getHttpServer())
        .post('/elder-profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId,
          dateOfBirth: '1950-01-01',
          gender: 'MALE',
          medicalRecordNo: 'TEST-001',
          address: '123 Test St',
          emergencyContact: [
            {
              name: 'Emergency Contact',
              phone: '555-0100',
              relationship: 'Family',
            },
          ],
          medicalConditions: ['Test Condition'],
          allergies: ['Test Allergy'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      elderId = response.body.id;
    });

    it('should get elder profile', async () => {
      const response = await request(app.getHttpServer())
        .get(`/elder-profile/${elderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.medicalRecordNo).toBe('TEST-001');
    });

    it('should update elder profile', async () => {
      await request(app.getHttpServer())
        .patch(`/elder-profile/${elderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Updated notes',
        })
        .expect(200);
    });
  });

  describe('3. Smart Home Setup', () => {
    it('should create smart home', async () => {
      const response = await request(app.getHttpServer())
        .post('/smarthome/homes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          elderId,
          name: 'Test Home',
          address: '123 Test St',
          timezone: 'America/New_York',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      homeId = response.body.id;
    });

    it('should create zone', async () => {
      await request(app.getHttpServer())
        .post('/smarthome/zones')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          homeId,
          name: 'Living Room',
          zoneType: 'LIVING_AREA',
        })
        .expect(201);
    });

    it('should create automation rule', async () => {
      await request(app.getHttpServer())
        .post('/smarthome/rules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          homeId,
          name: 'Test Rule',
          triggerType: 'TIME_BASED',
          triggerConfigJson: { time: '18:00' },
          actionsConfigJson: [{ type: 'NOTIFICATION' }],
        })
        .expect(201);
    });
  });

  describe('4. Care Management', () => {
    it('should create care plan', async () => {
      await request(app.getHttpServer())
        .post('/care/care-plans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          elderId,
          title: 'Test Care Plan',
          description: 'Test Description',
          startDate: new Date().toISOString(),
        })
        .expect(201);
    });

    it('should create medication', async () => {
      await request(app.getHttpServer())
        .post('/care/medications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          elderId,
          name: 'Test Med',
          dosage: '10mg',
          frequency: 'ONCE_DAILY',
          startDate: new Date().toISOString(),
        })
        .expect(201);
    });

    it('should create appointment', async () => {
      await request(app.getHttpServer())
        .post('/care/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          elderId,
          title: 'Test Appointment',
          type: 'MEDICAL_CHECKUP',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
        })
        .expect(201);
    });

    it('should record vital reading', async () => {
      await request(app.getHttpServer())
        .post('/care/health-monitoring/vitals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          elderId,
          vitalType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
        })
        .expect(201);
    });
  });

  describe('5. Booking & Payments', () => {
    let serviceId: string;

    it('should get available services', async () => {
      const response = await request(app.getHttpServer())
        .get('/services')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        serviceId = response.body[0].id;
      }
    });

    it('should create booking', async () => {
      await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Test User',
          email: 'test@integration.com',
          phone: '555-0100',
          serviceType: 'IN_HOME',
          preferredDate: new Date().toISOString(),
          preferredTime: 'MORNING',
        })
        .expect(201);
    });

    it('should get Stripe config', async () => {
      const response = await request(app.getHttpServer())
        .get('/payments/config')
        .expect(200);

      expect(response.body).toHaveProperty('publishableKey');
    });
  });

  describe('6. Notifications', () => {
    it('should get notifications', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
