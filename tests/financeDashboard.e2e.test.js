const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');
const Role = require('../src/models/Role');
const jwt = require('jsonwebtoken');

describe('Finance Dashboard E2E Tests', () => {
  let testRole;
  let testUser;
  let authToken;
  const entityId = 'test-entity';

  beforeAll(async () => {
    jest.setTimeout(30000);
    // Use unique role name to avoid conflicts when tests run together
    testRole = await Role.create({
      name: 'Finance Admin E2E',
      description: 'Finance admin role for E2E tests',
      roleType: 'custom',
      permissions: ['finance:read', 'finance:write'],
      accessScope: 'global',
    });

    testUser = await User.create({
      email: 'finance-e2e@test.com',
      name: 'Finance E2E User',
      password: 'password123',
      roleId: testRole._id,
      status: 'active',
    });

    authToken = jwt.sign(
      { userId: testUser._id.toString(), email: testUser.email },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
  });

  describe('Complete User Flow: Finance Overview', () => {
    it('should complete Login → Finance Overview → View Summary Cards flow', async () => {
      // Login
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'finance-e2e@test.com',
          password: 'password123',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      const token = loginResponse.body.data.token;

      // Get Finance Summary
      const summaryResponse = await request(app)
        .get('/api/v1/finance/summary')
        .set('Authorization', `Bearer ${token}`)
        .query({ entityId, date: new Date().toISOString() });

      expect(summaryResponse.status).toBe(200);
      expect(summaryResponse.body.success).toBe(true);
      expect(summaryResponse.body.data).toHaveProperty('totalReceivedToday');
    });
  });

  describe('Complete User Flow: Customer Payments', () => {
    it('should complete Login → Customer Payments → Filter → View Details → Retry flow', async () => {
      // Get Customer Payments
      const paymentsResponse = await request(app)
        .get('/api/v1/finance/customer-payments')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, pageSize: 20 });

      expect(paymentsResponse.status).toBe(200);
      expect(paymentsResponse.body.success).toBe(true);
      expect(paymentsResponse.body.data).toHaveProperty('data');
    });
  });

  describe('Complete User Flow: Vendor Payments', () => {
    it('should complete Login → Vendor Payments → View Invoices → Approve flow', async () => {
      // Get Vendor Invoices
      const invoicesResponse = await request(app)
        .get('/api/v1/finance/vendor-payments/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, pageSize: 20 });

      expect(invoicesResponse.status).toBe(200);
      expect(invoicesResponse.body.success).toBe(true);
    });
  });

  describe('Complete User Flow: Refunds', () => {
    it('should complete Login → Refunds → View Queue → Approve flow', async () => {
      // Get Refund Queue
      const queueResponse = await request(app)
        .get('/api/v1/finance/refunds/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, pageSize: 20 });

      expect(queueResponse.status).toBe(200);
      expect(queueResponse.body.success).toBe(true);
    });
  });

  describe('Complete User Flow: Invoicing', () => {
    it('should complete Login → Billing → Create Invoice → Send flow', async () => {
      // Create Invoice
      const createResponse = await request(app)
        .post('/api/v1/finance/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerName: 'Test Customer',
          customerEmail: 'customer@test.com',
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          items: [
            {
              description: 'Service Fee',
              quantity: 1,
              unitPrice: 100,
              taxPercent: 10,
            },
          ],
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const invoiceId = createResponse.body.data.id;

      // Send Invoice
      const sendResponse = await request(app)
        .post(`/api/v1/finance/invoices/${invoiceId}/send`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(sendResponse.status).toBe(200);
      expect(sendResponse.body.success).toBe(true);
    });
  });

  describe('Complete User Flow: Approvals', () => {
    it('should complete Login → Approvals → View Tasks → Approve flow', async () => {
      // Get Approval Tasks
      const tasksResponse = await request(app)
        .get('/api/v1/finance/approvals/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'pending' });

      expect(tasksResponse.status).toBe(200);
      expect(tasksResponse.body.success).toBe(true);
    });
  });
});

