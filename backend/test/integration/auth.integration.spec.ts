/**
 * Integration Tests for Authentication Module
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/test-app';

describe('Authentication Integration Tests', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `test${Date.now()}@example.com`,
          password: 'TestPassw0rd123',
          firstName: 'Test',
          lastName: 'User',
          role: 'FAMILY',
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toContain('@example.com');
    });

    it('should fail with duplicate email', async () => {
      const email = `duplicate${Date.now()}@example.com`;

      // Create first user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'TestPassw0rd123',
          firstName: 'Test',
          lastName: 'User',
          role: 'FAMILY',
        });

      // Try to create duplicate
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'TestPassw0rd123',
          firstName: 'Test',
          lastName: 'User',
          role: 'FAMILY',
        })
        .expect(409);
    });

    it('should fail with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'TestPassw0rd123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    const testEmail = `login${Date.now()}@example.com`;
    const testPassword = 'TestPassw0rd123';

    beforeAll(async () => {
      // Create test user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          firstName: 'Login',
          lastName: 'Test',
          role: 'FAMILY',
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      authToken = response.body.access_token;
    });

    it('should fail with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassw0rd123',
        })
        .expect(401);
    });

    it('should fail with non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassw0rd123',
        })
        .expect(401);
    });
  });

  describe('GET /auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('firstName');
      expect(response.body).toHaveProperty('lastName');
      expect(response.body).toHaveProperty('role');
    });

    it('should fail without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /auth/change-password', () => {
    const testEmail = `changepass${Date.now()}@example.com`;
    const oldPassword = 'OldPassw0rd123';
    const newPassword = 'NewPassw0rd456';
    let userToken: string;

    beforeAll(async () => {
      // Create test user
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: oldPassword,
          firstName: 'Change',
          lastName: 'Password',
          role: 'FAMILY',
        });
      userToken = response.body.access_token;
    });

    it('should change password with valid current password', async () => {
      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: oldPassword,
          newPassword: newPassword,
        })
        .expect(200);

      // Verify can login with new password
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('access_token');
    });

    it('should fail with wrong current password', async () => {
      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'WrongPassw0rd123',
          newPassword: 'NewPassw0rd789',
        })
        .expect(401);
    });
  });
});
