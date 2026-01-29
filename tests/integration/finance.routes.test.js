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

describe('Finance API Routes', () => {
  describe('GET /api/v1/finance/dashboard/summary', () => {
    it('should return finance dashboard summary', async () => {
      const response = await request(app)
        .get('/api/v1/finance/dashboard/summary')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('GET /api/v1/finance/reconciliation', () => {
    it('should return reconciliation data', async () => {
      const response = await request(app)
        .get('/api/v1/finance/reconciliation')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });
  });
});
