const vendorPaymentsService = require('../services/vendorPaymentsService');
const { asyncHandler } = require('../../core/middleware');

class VendorPaymentsController {
  getPayablesSummary = asyncHandler(async (req, res) => {
    const summary = await vendorPaymentsService.getPayablesSummary();
    res.json({ success: true, data: summary });
  });

  getVendorInvoices = asyncHandler(async (req, res) => {
    const result = await vendorPaymentsService.getVendorInvoices(req.query);
    res.json({ success: true, data: result });
  });

  getVendorInvoiceDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const invoice = await vendorPaymentsService.getVendorInvoiceDetails(id);
    res.json({ success: true, data: invoice });
  });

  approveInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const invoice = await vendorPaymentsService.approveInvoice(id);
    res.json({ success: true, data: invoice });
  });

  rejectInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const invoice = await vendorPaymentsService.rejectInvoice(id, reason);
    res.json({ success: true, data: invoice });
  });

  markInvoicePaid = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const invoice = await vendorPaymentsService.markInvoicePaid(id);
    res.json({ success: true, data: invoice });
  });

  uploadInvoice = asyncHandler(async (req, res) => {
    const invoice = await vendorPaymentsService.uploadInvoice(req.body);
    res.status(201).json({ success: true, data: invoice });
  });

  createPayment = asyncHandler(async (req, res) => {
    const result = await vendorPaymentsService.createPayment(req.body);
    res.status(201).json({ success: true, data: result });
  });

  getVendors = asyncHandler(async (req, res) => {
    const vendors = await vendorPaymentsService.getVendors();
    res.json({ success: true, data: vendors });
  });
}

module.exports = new VendorPaymentsController();

