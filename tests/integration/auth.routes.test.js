const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createTestApp = require('../helpers/testApp');

const app = createTestApp();

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth API Routes', () => {
  describe('POST /api/v1/merch/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        name: 'Test User',
        role: 'merch'
      };

      const response = await request(app)
        .post('/api/v1/merch/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success');
    });

    it('should reject duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'TestPassword123!',
        name: 'Test User',
        role: 'merch'
      };

      await request(app)
        .post('/api/v1/merch/auth/register')
        .send(userData)
        .expect(201);

      // Try to register again with same email
      await request(app)
        .post('/api/v1/merch/auth/register')
        .send(userData)
        .expect(400);
    });
  });

  describe('POST /api/v1/merch/auth/login', () => {
    it('should login with valid credentials', async () => {
      // First register
      const userData = {
        email: 'login@example.com',
        password: 'TestPassword123!',
        name: 'Test User',
        role: 'merch'
      };

      await request(app)
        .post('/api/v1/merch/auth/register')
        .send(userData);

      // Then login
      const response = await request(app)
        .post('/api/v1/merch/auth/login')
        .send({
          email: 'login@example.com',
          password: 'TestPassword123!',
          role: 'merch'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/merch/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'WrongPassword',
          role: 'merch'
        })
        .expect(401);

      expect(response.body).toHaveProperty('code', 401);
    });
  });
});
