const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');
const Role = require('../src/models/Role');
const FinanceSummary = require('../src/models/FinanceSummary');
const LiveTransaction = require('../src/models/LiveTransaction');
const CustomerPayment = require('../src/models/CustomerPayment');
const VendorInvoice = require('../src/models/VendorInvoice');
const RefundRequest = require('../src/models/RefundRequest');
const Invoice = require('../src/models/Invoice');
const FinanceAlert = require('../src/models/FinanceAlert');
const ApprovalTask = require('../src/models/ApprovalTask');
const jwt = require('jsonwebtoken');

describe('Finance Dashboard API', () => {
  let testRole;
  let testUser;
  let authToken;
  const entityId = 'test-entity';

  beforeAll(async () => {
    jest.setTimeout(30000);
    testRole = await Role.create({
      name: 'Finance Admin',
      description: 'Finance admin role',
      roleType: 'custom',
      permissions: ['finance:read', 'finance:write'],
      accessScope: 'global',
    });

    testUser = await User.create({
      email: 'finance@test.com',
      name: 'Finance User',
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

  beforeEach(async () => {
    // Clean up test data before each test to ensure isolation
    await FinanceSummary.deleteMany({});
    await LiveTransaction.deleteMany({});
    await CustomerPayment.deleteMany({});
    await VendorInvoice.deleteMany({});
    await RefundRequest.deleteMany({});
    await Invoice.deleteMany({});
    await FinanceAlert.deleteMany({});
    await ApprovalTask.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await FinanceSummary.deleteMany({});
    await LiveTransaction.deleteMany({});
    await CustomerPayment.deleteMany({});
    await VendorInvoice.deleteMany({});
    await RefundRequest.deleteMany({});
    await Invoice.deleteMany({});
    await FinanceAlert.deleteMany({});
    await ApprovalTask.deleteMany({});
  });

  describe('Finance Overview', () => {
    it('should get finance summary', async () => {
      await FinanceSummary.create({
        entityId,
        date: new Date(),
        totalReceivedToday: 100000,
        totalReceivedChangePercent: 15,
        pendingSettlementsAmount: 5000,
        pendingSettlementsGateways: 2,
        vendorPayoutsAmount: 20000,
        vendorPayoutsStatusText: 'Scheduled Today',
        failedPaymentsRatePercent: 1.2,
        failedPaymentsCount: 10,
        failedPaymentsThresholdPercent: 1.0,
      });

      const response = await request(app)
        .get('/api/v1/finance/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ entityId, date: new Date().toISOString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalReceivedToday');
    });

    it('should get payment method split', async () => {
      jest.setTimeout(10000);
      await LiveTransaction.create({
        entityId,
        txnId: 'TXN-001',
        amount: 100,
        currency: 'USD',
        methodDisplay: 'Visa',
        maskedDetails: '**** 1234',
        status: 'success',
        gateway: 'Stripe',
        createdAt: new Date(),
      });

      const response = await request(app)
        .get('/api/v1/finance/payment-method-split')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ entityId, date: new Date().toISOString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get live transactions', async () => {
      const response = await request(app)
        .get('/api/v1/finance/live-transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ entityId, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Customer Payments', () => {
    it('should get customer payments', async () => {
      await CustomerPayment.create({
        customerName: 'Test Customer',
        customerEmail: 'customer@test.com',
        orderId: 'ORD-001',
        amount: 100,
        currency: 'USD',
        paymentMethodDisplay: 'Visa **** 1234',
        methodType: 'card',
        gatewayRef: 'ch_123',
        status: 'captured',
        retryEligible: false,
      });

      const response = await request(app)
        .get('/api/v1/finance/customer-payments')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, pageSize: 20 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('total');
    });

    it('should get customer payment details', async () => {
      const payment = await CustomerPayment.create({
        customerName: 'Test Customer',
        customerEmail: 'customer@test.com',
        orderId: 'ORD-002',
        amount: 200,
        currency: 'USD',
        paymentMethodDisplay: 'Mastercard **** 5678',
        methodType: 'card',
        gatewayRef: 'ch_456',
        status: 'pending',
        retryEligible: true,
      });

      const response = await request(app)
        .get(`/api/v1/finance/customer-payments/${payment._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orderId).toBe('ORD-002');
    });
  });

  describe('Vendor Payments', () => {
    it('should get payables summary', async () => {
      const response = await request(app)
        .get('/api/v1/finance/vendor-payments/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('outstandingPayablesAmount');
    });

    it('should get vendor invoices', async () => {
      const response = await request(app)
        .get('/api/v1/finance/vendor-payments/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, pageSize: 20 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
    });
  });

  describe('Refunds', () => {
    it('should get refunds summary', async () => {
      const response = await request(app)
        .get('/api/v1/finance/refunds/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('refundRequestsCount');
    });

    it('should get refund queue', async () => {
      await RefundRequest.create({
        orderId: 'ORD-003',
        customerId: 'CUST-001',
        customerName: 'Test Customer',
        customerEmail: 'customer@test.com',
        reasonCode: 'item_damaged',
        reasonText: 'Item was damaged',
        amount: 50,
        currency: 'USD',
        status: 'pending',
        channel: 'self_service',
      });

      const response = await request(app)
        .get('/api/v1/finance/refunds/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, pageSize: 20 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
    });
  });

  describe('Invoicing', () => {
    it('should get invoice summary', async () => {
      const response = await request(app)
        .get('/api/v1/finance/invoices/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sentCount');
    });

    it('should create invoice', async () => {
      const response = await request(app)
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

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('invoiceNumber');
    });
  });

  describe('Finance Alerts', () => {
    it('should get alerts', async () => {
      await FinanceAlert.create({
        type: 'gateway_failure_rate',
        title: 'High Failure Rate',
        description: 'Gateway failure rate is high',
        severity: 'critical',
        status: 'open',
        source: { gateway: 'Stripe' },
        suggestedActions: ['check_gateway'],
      });

      const response = await request(app)
        .get('/api/v1/finance/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'open' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Approvals', () => {
    it('should get approval summary', async () => {
      const response = await request(app)
        .get('/api/v1/finance/approvals/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('refundRequestsCount');
    });

    it('should get approval tasks', async () => {
      await ApprovalTask.create({
        type: 'refund',
        description: 'Test refund approval',
        amount: 100,
        currency: 'USD',
        requesterName: 'Test User',
        requesterRole: 'Support Agent',
        status: 'pending',
      });

      const response = await request(app)
        .get('/api/v1/finance/approvals/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'pending' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

