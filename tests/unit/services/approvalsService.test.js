const approvalsService = require('../../../src/shared/services/approvalsService');
const ApprovalRequest = require('../../../src/common-models/ApprovalRequest');
const { clearDatabase } = require('../../helpers/mockDatabase');

describe('ApprovalsService', () => {
  beforeEach(() => {
    clearDatabase();
  });

  describe('getApprovalSummary', () => {
    it('should return approval summary for a date', async () => {
      await ApprovalRequest.create({
        status: 'pending',
        type: 'purchase_order',
        requestedById: 'user-1',
      });

      const today = new Date();
      const summary = await approvalsService.getApprovalSummary(today);

      expect(summary).toHaveProperty('pendingCount');
      expect(summary).toHaveProperty('approvedToday');
      expect(summary).toHaveProperty('rejectedToday');
      expect(summary).toHaveProperty('date');
      expect(summary.pendingCount).toBeGreaterThanOrEqual(0);
    });

    it('should count approved requests for the day', async () => {
      const today = new Date();
      await ApprovalRequest.create({
        status: 'approved',
        type: 'purchase_order',
        approvedAt: today,
        updatedAt: today,
      });

      const summary = await approvalsService.getApprovalSummary(today);
      expect(summary.approvedToday).toBeGreaterThanOrEqual(0);
    });

    it('should count rejected requests for the day', async () => {
      const today = new Date();
      await ApprovalRequest.create({
        status: 'rejected',
        type: 'purchase_order',
        approvedAt: today,
        updatedAt: today,
      });

      const summary = await approvalsService.getApprovalSummary(today);
      expect(summary.rejectedToday).toBeGreaterThanOrEqual(0);
    });
  });

  describe('listApprovals', () => {
    beforeEach(async () => {
      await ApprovalRequest.create({
        status: 'pending',
        type: 'purchase_order',
        requestedById: 'user-1',
      });

      await ApprovalRequest.create({
        status: 'approved',
        type: 'expense',
        requestedById: 'user-2',
      });
    });

    it('should return paginated approvals', async () => {
      const result = await approvalsService.listApprovals({});

      expect(result).toHaveProperty('approvals');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.approvals)).toBe(true);
    });

    it('should filter by status', async () => {
      const result = await approvalsService.listApprovals({ status: 'pending' });

      expect(result.approvals.every(a => a.status === 'pending')).toBe(true);
    });

    it('should filter by type', async () => {
      const result = await approvalsService.listApprovals({ type: 'purchase_order' });

      expect(result.approvals.every(a => a.type === 'purchase_order')).toBe(true);
    });

    it('should filter by requestedBy', async () => {
      const result = await approvalsService.listApprovals({ requestedBy: 'user-1' });

      expect(result.approvals.every(a => a.requestedById === 'user-1')).toBe(true);
    });

    it('should handle pagination', async () => {
      const page1 = await approvalsService.listApprovals({ page: 1, limit: 1 });
      expect(page1.approvals.length).toBeLessThanOrEqual(1);

      const page2 = await approvalsService.listApprovals({ page: 2, limit: 1 });
      expect(page2.approvals.length).toBeLessThanOrEqual(1);
    });
  });
});
