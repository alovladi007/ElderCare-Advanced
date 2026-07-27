import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/test-app';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('probe', () => {
  let app: INestApplication; let token: string; let elderId: string;
  beforeAll(async () => {
    app = await createTestApp({ globalPrefix: 'api' });
    const prisma = app.get(PrismaService);
    const s = Date.now();
    const u = await request(app.getHttpServer()).post('/api/auth/register').send({ email: `p${s}@e.com`, password: 'TestPassw0rd123', firstName: 'A', lastName: 'B', role: 'FAMILY' });
    token = u.body.access_token;
    const eu = await request(app.getHttpServer()).post('/api/auth/register').send({ email: `pe${s}@e.com`, password: 'TestPassw0rd123', firstName: 'A', lastName: 'B', role: 'ELDER' });
    const e = await prisma.elderProfile.create({ data: { userId: eu.body.user.id, firstName: 'A', lastName: 'B', dateOfBirth: new Date('1950-01-01'), gender: 'MALE', medicalRecordNo: `P-${s}` } });
    elderId = e.id;
    await request(app.getHttpServer()).post('/api/care-management/health/vitals').set('Authorization', `Bearer ${token}`).send({ elderId, vitalType: 'HEART_RATE', value: 72, unit: 'bpm' });
  });
  afterAll(async () => { await app.close(); });

  const paths = () => [
    `/api/care-management/health/vitals/elder/${elderId}`,
    `/api/care-management/health/elder/${elderId}/summary`,
    `/api/care-management/medications/elder/${elderId}/adherence`,
    `/api/care-management/medications/elder/${elderId}/upcoming-doses`,
    `/api/care-management/appointments/elder/${elderId}/stats`,
    `/api/care-management/appointments/elder/${elderId}/upcoming`,
  ];

  it('probes optional numeric query params', async () => {
    for (const p of paths()) {
      const bare = await request(app.getHttpServer()).get(p).set('Authorization', `Bearer ${token}`);
      const withDays = await request(app.getHttpServer()).get(p).query({ days: 30 }).set('Authorization', `Bearer ${token}`);
      const junk = await request(app.getHttpServer()).get(p).query({ days: 'abc' }).set('Authorization', `Bearer ${token}`);
      console.log('PROBE', p.replace(elderId, ':id'), 'bare=', bare.status, 'days=30 ->', withDays.status, 'days=abc ->', junk.status);
    }
  });
});
