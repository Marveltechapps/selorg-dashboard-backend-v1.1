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

describe('Merch API Routes', () => {
  describe('GET /api/v1/merch/overview/stats', () => {
    it('should return merch stats', async () => {
      const response = await request(app)
        .get('/api/v1/merch/overview/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('activeCampaigns');
      expect(response.body.data).toHaveProperty('promoUplift');
      expect(response.body.data).toHaveProperty('priceChanges');
      expect(response.body.data).toHaveProperty('stockConflicts');
    });
  });

  describe('GET /api/v1/merch/campaigns', () => {
    it('should return campaigns list', async () => {
      const response = await request(app)
        .get('/api/v1/merch/campaigns')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter campaigns by status', async () => {
      const response = await request(app)
        .get('/api/v1/merch/campaigns?status=Active')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/v1/merch/campaigns', () => {
    it('should create a new campaign', async () => {
      const campaignData = {
        name: 'Test Campaign',
        tagline: 'Test Tagline',
        period: '2024-01-01 to 2024-01-31',
        target: 'All Customers',
        scope: 'Global',
        type: 'Discount',
        owner: {
          name: 'Test User',
          initial: 'TU'
        },
        rules: {
          discountLogic: '10% Off',
          minOrder: '$0.00',
          segment: 'All Customers',
          stackable: false
        },
        skus: []
      };

      const response = await request(app)
        .post('/api/v1/merch/campaigns')
        .send(campaignData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('name', 'Test Campaign');
    });
  });

  describe('GET /api/v1/merch/catalog/skus', () => {
    it('should return SKUs list', async () => {
      const response = await request(app)
        .get('/api/v1/merch/catalog/skus')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/merch/catalog/skus', () => {
    it('should create a new SKU', async () => {
      const skuData = {
        code: 'TEST-SKU-001',
        name: 'Test Product',
        category: 'Test Category',
        brand: 'Test Brand',
        cost: 10,
        basePrice: 15,
        sellingPrice: 15,
        competitorAvg: 14,
        margin: 33.33,
        marginStatus: 'healthy',
        stock: 100,
        visibility: {
          'North America': 'Visible',
          'Europe (West)': 'Visible',
          'APAC': 'Visible'
        },
        tags: ['test'],
        history: []
      };

      const response = await request(app)
        .post('/api/v1/merch/catalog/skus')
        .send(skuData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('code', 'TEST-SKU-001');
    });
  });
});
