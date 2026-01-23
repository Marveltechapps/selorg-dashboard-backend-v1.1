const invoicingService = require('../services/invoicingService');
const { asyncHandler } = require('../../core/middleware');

class InvoicingController {
  getInvoiceSummary = asyncHandler(async (req, res) => {
    const summary = await invoicingService.getInvoiceSummary();
    res.json({ success: true, data: summary });
  });

  getInvoices = asyncHandler(async (req, res) => {
    const { status, search } = req.query;
    const invoices = await invoicingService.getInvoices(status, search);
    res.json({ success: true, data: invoices });
  });

  getInvoiceDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const invoice = await invoicingService.getInvoiceDetails(id);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }
    res.json({ success: true, data: invoice });
  });

  createInvoice = asyncHandler(async (req, res) => {
    const invoice = await invoicingService.createInvoice(req.body);
    res.status(201).json({ success: true, data: invoice });
  });

  updateInvoiceStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const invoice = await invoicingService.updateInvoiceStatus(id, status);
    res.json({ success: true, data: invoice });
  });

  sendInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await invoicingService.sendInvoice(id);
    res.json({ success: true, message: 'Invoice sent successfully' });
  });

  sendReminder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await invoicingService.sendReminder(id);
    res.json({ success: true, message: 'Reminder sent successfully' });
  });

  markInvoicePaid = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await invoicingService.markInvoicePaid(id);
    res.json({ success: true, message: 'Invoice marked as paid' });
  });
}

module.exports = new InvoicingController();

