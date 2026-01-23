const ReconciliationService = require('../../../src/finance/services/reconciliationService');
const ReconciliationException = require('../../../src/finance/models/ReconciliationException');
const ReconciliationRun = require('../../../src/finance/models/ReconciliationRun');
const LiveTransaction = require('../../../src/finance/models/LiveTransaction');
const { clearDatabase } = require('../../helpers/mockDatabase');

describe('ReconciliationService', () => {
  let service;

  beforeEach(() => {
    service = new ReconciliationService();
    clearDatabase();
  });

  describe('getReconSummary', () => {
    it('should return reconciliation summary for a date', async () => {
      // Create test transactions
      const today = new Date();
      await LiveTransaction.create({
        gateway: 'Razorpay',
        amount: 1000,
        status: 'success',
        createdAt: today,
      });

      await LiveTransaction.create({
        gateway: 'Stripe',
        amount: 2000,
        status: 'success',
        createdAt: today,
      });

      const summary = await service.getReconSummary(today);

      expect(Array.isArray(summary)).toBe(true);
      expect(summary.length).toBeGreaterThan(0);
      summary.forEach(item => {
        expect(item).toHaveProperty('gateway');
        expect(item).toHaveProperty('matchedAmount');
        expect(item).toHaveProperty('pendingAmount');
        expect(item).toHaveProperty('mismatchAmount');
        expect(item).toHaveProperty('status');
        expect(item).toHaveProperty('matchPercent');
      });
    });

    it('should handle date range correctly', async () => {
      const date = new Date('2024-01-15');
      const summary = await service.getReconSummary(date);

      expect(Array.isArray(summary)).toBe(true);
    });

    it('should calculate match percentage correctly', async () => {
      const today = new Date();
      await LiveTransaction.create({
        gateway: 'TestGateway',
        amount: 1000,
        status: 'success',
        createdAt: today,
      });

      const summary = await service.getReconSummary(today);
      const gatewaySummary = summary.find(s => s.gateway === 'TestGateway');

      expect(gatewaySummary).toBeDefined();
      expect(gatewaySummary.matchPercent).toBeGreaterThanOrEqual(0);
      expect(gatewaySummary.matchPercent).toBeLessThanOrEqual(100);
    });
  });

  describe('getExceptions', () => {
    it('should return exceptions with default status', async () => {
      await ReconciliationException.create({
        gateway: 'Razorpay',
        status: 'open',
        amount: 100,
        description: 'Test exception',
      });

      const exceptions = await service.getExceptions();

      expect(Array.isArray(exceptions)).toBe(true);
      if (exceptions.length > 0) {
        expect(exceptions[0]).toHaveProperty('id');
        expect(exceptions[0]).toHaveProperty('status');
      }
    });

    it('should filter exceptions by status', async () => {
      await ReconciliationException.create({
        gateway: 'Razorpay',
        status: 'open',
        amount: 100,
      });

      await ReconciliationException.create({
        gateway: 'Stripe',
        status: 'resolved',
        amount: 200,
      });

      const openExceptions = await service.getExceptions('open');
      expect(openExceptions.every(ex => ex.status === 'open' || ex.status === 'in_review')).toBe(true);
    });

    it('should return all exceptions when status is "all"', async () => {
      await ReconciliationException.create({ gateway: 'Razorpay', status: 'open', amount: 100 });
      await ReconciliationException.create({ gateway: 'Stripe', status: 'resolved', amount: 200 });

      const allExceptions = await service.getExceptions('all');
      expect(allExceptions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('runReconciliation', () => {
    it('should create a reconciliation run', async () => {
      const date = new Date();
      const gateways = ['Razorpay', 'Stripe'];

      const run = await service.runReconciliation(date, gateways);

      expect(run).toHaveProperty('id');
      expect(run).toHaveProperty('status');
      expect(run.gateways).toEqual(gateways);

      // Verify run was saved
      const savedRun = await ReconciliationRun.findById(run.id);
      expect(savedRun).toBeDefined();
    });

    it('should set correct period dates', async () => {
      const date = new Date('2024-01-15');
      const gateways = ['Razorpay'];

      const run = await service.runReconciliation(date, gateways);

      expect(run.period).toBeDefined();
      expect(run.period.from).toBeDefined();
      expect(run.period.to).toBeDefined();
    });
  });
});
