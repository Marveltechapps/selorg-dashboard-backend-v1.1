/**
 * E2E Test: Finance Reconciliation Flow
 * Tests: Login → View transactions → Flag discrepancy → Reconcile → Generate report
 */

const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const { getAuthHeaders, testUsers } = require('../helpers/mockAuth');
const { clearDatabase } = require('../helpers/mockDatabase');
const LiveTransaction = require('../../src/finance/models/LiveTransaction');
const ReconciliationException = require('../../src/finance/models/ReconciliationException');

const app = createTestApp();

describe('E2E: Finance Reconciliation Flow', () => {
  beforeEach(async () => {
    clearDatabase();
    
    // Create test transactions
    await LiveTransaction.create({
      gateway: 'Razorpay',
      amount: 1000,
      status: 'success',
      transactionId: 'TXN-001',
      createdAt: new Date(),
    });

    await LiveTransaction.create({
      gateway: 'Stripe',
      amount: 2000,
      status: 'success',
      transactionId: 'TXN-002',
      createdAt: new Date(),
    });
  });

  it('should complete full reconciliation workflow', async () => {
    const authHeaders = getAuthHeaders(testUsers.finance);

    // Step 1: View transactions/reconciliation summary
    const summaryResponse = await request(app)
      .get('/api/v1/finance/reconciliation/summary')
      .set(authHeaders)
      .expect(200);

    expect(summaryResponse.body.success).toBe(true);
    expect(Array.isArray(summaryResponse.body.data)).toBe(true);

    // Step 2: Create a reconciliation exception (flag discrepancy)
    const exceptionResponse = await request(app)
      .post('/api/v1/finance/reconciliation/exceptions')
      .set(authHeaders)
      .send({
        gateway: 'Razorpay',
        amount: 1000,
        expectedAmount: 1100,
        description: 'Amount mismatch detected',
        transactionId: 'TXN-001',
      })
      .expect(201);

    expect(exceptionResponse.body.success).toBe(true);
    const exceptionId = exceptionResponse.body.data.id;

    // Step 3: View exceptions
    const exceptionsResponse = await request(app)
      .get('/api/v1/finance/reconciliation/exceptions?status=open')
      .set(authHeaders)
      .expect(200);

    expect(exceptionsResponse.body.success).toBe(true);
    const createdException = exceptionsResponse.body.data.find(
      ex => ex.id === exceptionId
    );
    expect(createdException).toBeDefined();
    expect(createdException.status).toBe('open');

    // Step 4: Reconcile the exception
    const reconcileResponse = await request(app)
      .patch(`/api/v1/finance/reconciliation/exceptions/${exceptionId}/reconcile`)
      .set(authHeaders)
      .send({
        resolution: 'adjusted',
        notes: 'Adjusted amount to match gateway',
      })
      .expect(200);

    expect(reconcileResponse.body.success).toBe(true);

    // Step 5: Verify exception status updated
    const updatedException = await ReconciliationException.findById(exceptionId);
    expect(updatedException.status).toBe('resolved');

    // Step 6: Generate reconciliation report
    const reportResponse = await request(app)
      .get('/api/v1/finance/reconciliation/report')
      .set(authHeaders)
      .query({ date: new Date().toISOString().split('T')[0] })
      .expect(200);

    expect(reportResponse.body.success).toBe(true);
  });
});
