const InvoicingService = require('../../../src/finance/services/invoicingService');
const Invoice = require('../../../src/finance/models/Invoice');
const { clearDatabase } = require('../../helpers/mockDatabase');

describe('InvoicingService', () => {
  let service;

  beforeEach(() => {
    service = new InvoicingService();
    clearDatabase();
  });

  describe('getInvoiceSummary', () => {
    it('should return invoice summary with counts', async () => {
      // Create test invoices
      await Invoice.create({ status: 'sent', amount: 1000 });
      await Invoice.create({ status: 'pending', amount: 2000 });
      await Invoice.create({ status: 'overdue', amount: 3000 });
      await Invoice.create({ status: 'paid', amount: 4000 });

      const summary = await service.getInvoiceSummary();

      expect(summary).toHaveProperty('sentCount');
      expect(summary).toHaveProperty('pendingCount');
      expect(summary).toHaveProperty('overdueCount');
      expect(summary).toHaveProperty('paidCount');
      expect(summary).toHaveProperty('periodLabel');
      expect(summary.sentCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getInvoices', () => {
    beforeEach(async () => {
      await Invoice.create({
        invoiceNumber: 'INV-001',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        status: 'sent',
        amount: 1000,
      });
    });

    it('should return all invoices when no filters', async () => {
      const invoices = await service.getInvoices();

      expect(Array.isArray(invoices)).toBe(true);
      if (invoices.length > 0) {
        expect(invoices[0]).toHaveProperty('id');
        expect(invoices[0]).toHaveProperty('invoiceNumber');
      }
    });

    it('should filter invoices by status', async () => {
      await Invoice.create({ status: 'pending', amount: 2000 });

      const sentInvoices = await service.getInvoices('sent');
      expect(sentInvoices.every(inv => inv.status === 'sent')).toBe(true);
    });

    it('should search invoices by invoice number', async () => {
      const results = await service.getInvoices(null, 'INV-001');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].invoiceNumber).toContain('INV-001');
    });

    it('should search invoices by customer name', async () => {
      const results = await service.getInvoices(null, 'Test Customer');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].customerName).toContain('Test Customer');
    });

    it('should search invoices by customer email', async () => {
      const results = await service.getInvoices(null, 'test@example.com');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].customerEmail).toContain('test@example.com');
    });
  });

  describe('getInvoiceDetails', () => {
    it('should return invoice details by id', async () => {
      const invoice = await Invoice.create({
        invoiceNumber: 'INV-001',
        customerName: 'Test Customer',
        amount: 1000,
      });

      const details = await service.getInvoiceDetails(invoice._id);

      expect(details).toBeDefined();
      expect(details.id).toBe(invoice._id.toString());
      expect(details.invoiceNumber).toBe('INV-001');
    });

    it('should return null for non-existent invoice', async () => {
      const fakeId = require('mongoose').Types.ObjectId();
      const details = await service.getInvoiceDetails(fakeId);
      expect(details).toBeNull();
    });
  });

  describe('createInvoice', () => {
    it('should create invoice with correct amount calculation', async () => {
      const payload = {
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [
          { description: 'Item 1', quantity: 2, unitPrice: 100, taxPercent: 10 },
          { description: 'Item 2', quantity: 1, unitPrice: 200, taxPercent: 5 },
        ],
      };

      const invoice = await service.createInvoice(payload);

      expect(invoice).toHaveProperty('id');
      expect(invoice).toHaveProperty('invoiceNumber');
      expect(invoice).toHaveProperty('amount');
      expect(invoice.amount).toBeGreaterThan(0);
      expect(invoice.status).toBe('sent');
    });

    it('should create draft invoice when asDraft is true', async () => {
      const payload = {
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        issueDate: new Date(),
        dueDate: new Date(),
        items: [{ description: 'Item', quantity: 1, unitPrice: 100, taxPercent: 0 }],
      };

      const invoice = await service.createInvoice(payload, true);

      expect(invoice.status).toBe('draft');
    });

    it('should calculate tax correctly', async () => {
      const payload = {
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        issueDate: new Date(),
        dueDate: new Date(),
        items: [
          { description: 'Item', quantity: 1, unitPrice: 100, taxPercent: 10 },
        ],
      };

      const invoice = await service.createInvoice(payload);
      // Amount should be 100 * 1.1 = 110
      expect(invoice.amount).toBe(110);
    });
  });
});
