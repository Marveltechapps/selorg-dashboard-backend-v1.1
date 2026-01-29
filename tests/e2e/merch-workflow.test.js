const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createTestApp = require('../helpers/testApp');

const app = createTestApp();

let mongoServer;
let authToken;
let campaignId;
let skuId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Register and login to get auth token
  const userData = {
    email: 'e2e@example.com',
    password: 'TestPassword123!',
    name: 'E2E Test User',
    role: 'merch'
  };

  await request(app)
    .post('/api/v1/merch/auth/register')
    .send(userData);

  const loginResponse = await request(app)
    .post('/api/v1/merch/auth/login')
    .send({
      email: 'e2e@example.com',
      password: 'TestPassword123!',
      role: 'merch'
    });

  authToken = loginResponse.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Merch Dashboard E2E Workflow', () => {
  it('should complete full campaign creation workflow', async () => {
    // Step 1: Create a SKU
    const skuResponse = await request(app)
      .post('/api/v1/merch/catalog/skus')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        code: 'E2E-SKU-001',
        name: 'E2E Test Product',
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
        tags: ['e2e-test'],
        history: []
      })
      .expect(201);

    skuId = skuResponse.body.data._id;

    // Step 2: Create a campaign with the SKU
    const campaignResponse = await request(app)
      .post('/api/v1/merch/campaigns')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E2E Test Campaign',
        tagline: 'E2E Test Tagline',
        period: '2024-01-01 to 2024-01-31',
        target: 'All Customers',
        scope: 'Global',
        type: 'Discount',
        owner: {
          name: 'E2E Test User',
          initial: 'ET'
        },
        rules: {
          discountLogic: '10% Off',
          minOrder: '$0.00',
          segment: 'All Customers',
          stackable: false
        },
        skus: [{
          sku: 'E2E-SKU-001',
          name: 'E2E Test Product',
          category: 'Test Category',
          basePrice: 15,
          promoPrice: 13.50
        }]
      })
      .expect(201);

    campaignId = campaignResponse.body.data._id;

    // Step 3: Verify campaign appears in list
    const campaignsResponse = await request(app)
      .get('/api/v1/merch/campaigns')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const campaign = campaignsResponse.body.data.find(c => c._id === campaignId);
    expect(campaign).toBeDefined();
    expect(campaign.name).toBe('E2E Test Campaign');

    // Step 4: Update campaign
    const updateResponse = await request(app)
      .put(`/api/v1/merch/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'Active'
      })
      .expect(200);

    expect(updateResponse.body.data.status).toBe('Active');

    // Step 5: Check overview stats reflect the campaign
    const statsResponse = await request(app)
      .get('/api/v1/merch/overview/stats')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(statsResponse.body.data.activeCampaigns).toBeDefined();
  });

  it('should handle price change approval workflow', async () => {
    // Step 1: Create a price change request
    const priceChangeResponse = await request(app)
      .post('/api/v1/merch/overview/price-changes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        sku: 'E2E-SKU-001',
        productName: 'E2E Test Product',
        category: 'Test Category',
        currentPrice: 15,
        proposedPrice: 16,
        marginImpact: '+5%',
        status: 'Pending',
        requestedBy: 'E2E Test User'
      })
      .expect(201);

    const priceChangeId = priceChangeResponse.body.data._id;

    // Step 2: Get pending updates
    const pendingResponse = await request(app)
      .get('/api/v1/merch/pricing/pending-updates')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(pendingResponse.body.data.length).toBeGreaterThan(0);

    // Step 3: Approve the price change
    const approveResponse = await request(app)
      .put(`/api/v1/merch/pricing/pending-updates/${priceChangeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'Approved'
      })
      .expect(200);

    expect(approveResponse.body.data.status).toBe('Approved');
  });
});
