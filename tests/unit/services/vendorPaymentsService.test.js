const VendorPaymentsService = require('../../../src/finance/services/vendorPaymentsService');
const VendorInvoice = require('../../../src/finance/models/VendorInvoice');
const Vendor = require('../../../src/finance/models/Vendor');
const { clearDatabase } = require('../../helpers/mockDatabase');

describe('VendorPaymentsService', () => {
  let service;

  beforeEach(() => {
    service = new VendorPaymentsService();
    clearDatabase();
  });

  describe('getPayablesSummary', () => {
    it('should return payables summary', async () => {
      const vendor = await Vendor.create({ name: 'Test Vendor' });

      await VendorInvoice.create({
        vendorId: vendor._id,
        amount: 1000,
        status: 'pending_approval',
      });

      await VendorInvoice.create({
        vendorId: vendor._id,
        amount: 2000,
        status: 'approved',
      });

      const summary = await service.getPayablesSummary();

      expect(summary).toHaveProperty('outstandingPayablesAmount');
      expect(summary).toHaveProperty('pendingApprovalCount');
      expect(summary).toHaveProperty('overdueAmount');
      expect(summary).toHaveProperty('overdueVendorsCount');
      expect(summary.outstandingPayablesAmount).toBeGreaterThanOrEqual(0);
    });

    it('should calculate overdue amounts correctly', async () => {
      const vendor = await Vendor.create({ name: 'Test Vendor' });

      await VendorInvoice.create({
        vendorId: vendor._id,
        amount: 500,
        status: 'overdue',
      });

      const summary = await service.getPayablesSummary();
      expect(summary.overdueAmount).toBe(500);
    });
  });

  describe('getVendorInvoices', () => {
    let vendor1, vendor2;

    beforeEach(async () => {
      vendor1 = await Vendor.create({ name: 'Vendor 1' });
      vendor2 = await Vendor.create({ name: 'Vendor 2' });

      await VendorInvoice.create({
        vendorId: vendor1._id,
        amount: 1000,
        status: 'pending_approval',
        invoiceDate: new Date('2024-01-01'),
      });

      await VendorInvoice.create({
        vendorId: vendor2._id,
        amount: 2000,
        status: 'approved',
        invoiceDate: new Date('2024-01-15'),
      });
    });

    it('should return paginated vendor invoices', async () => {
      const result = await service.getVendorInvoices({});

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const result = await service.getVendorInvoices({ status: 'pending_approval' });

      expect(result.data.every(inv => inv.status === 'pending_approval')).toBe(true);
    });

    it('should filter by vendorId', async () => {
      const result = await service.getVendorInvoices({ vendorId: vendor1._id.toString() });

      expect(result.data.every(inv => inv.vendorId.toString() === vendor1._id.toString())).toBe(true);
    });

    it('should filter by date range', async () => {
      const result = await service.getVendorInvoices({
        dateFrom: '2024-01-01',
        dateTo: '2024-01-10',
      });

      expect(result.data.length).toBeGreaterThanOrEqual(0);
      result.data.forEach(inv => {
        const invoiceDate = new Date(inv.invoiceDate);
        expect(invoiceDate >= new Date('2024-01-01')).toBe(true);
        expect(invoiceDate <= new Date('2024-01-10')).toBe(true);
      });
    });

    it('should handle pagination correctly', async () => {
      // Create more invoices
      for (let i = 0; i < 5; i++) {
        await VendorInvoice.create({
          vendorId: vendor1._id,
          amount: 1000 + i,
          status: 'approved',
        });
      }

      const page1 = await service.getVendorInvoices({ page: 1, pageSize: 3 });
      expect(page1.data.length).toBeLessThanOrEqual(3);
      expect(page1.page).toBe(1);

      const page2 = await service.getVendorInvoices({ page: 2, pageSize: 3 });
      expect(page2.page).toBe(2);
    });
  });

  describe('getVendorInvoiceDetails', () => {
    it('should return invoice details with vendor information', async () => {
      const vendor = await Vendor.create({ name: 'Test Vendor', email: 'vendor@test.com' });
      const invoice = await VendorInvoice.create({
        vendorId: vendor._id,
        amount: 1000,
        status: 'pending_approval',
      });

      const details = await service.getVendorInvoiceDetails(invoice._id);

      expect(details).toBeDefined();
      expect(details.id).toBe(invoice._id.toString());
      expect(details.vendorDetails).toBeDefined();
      expect(details.vendorDetails.name).toBe('Test Vendor');
    });

    it('should throw error for non-existent invoice', async () => {
      const fakeId = require('mongoose').Types.ObjectId();

      await expect(service.getVendorInvoiceDetails(fakeId)).rejects.toThrow('Invoice not found');
    });
  });
});
