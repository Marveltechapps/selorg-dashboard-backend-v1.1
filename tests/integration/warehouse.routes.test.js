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

describe('Warehouse API Routes', () => {
  describe('GET /api/v1/warehouse/inventory', () => {
    it('should return inventory list', async () => {
      const response = await request(app)
        .get('/api/v1/warehouse/inventory')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('GET /api/v1/warehouse/orders', () => {
    it('should return orders list', async () => {
      const response = await request(app)
        .get('/api/v1/warehouse/orders')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });
  });
});
