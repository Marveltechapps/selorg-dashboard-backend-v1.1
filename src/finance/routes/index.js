const { Router } = require('express');
const financeDashboardController = require('../controllers/financeDashboardController');
const customerPaymentsController = require('../controllers/customerPaymentsController');
const vendorPaymentsController = require('../controllers/vendorPaymentsController');
const refundsController = require('../controllers/refundsController');
const reconciliationController = require('../controllers/reconciliationController');
const accountingController = require('../controllers/accountingController');
const invoicingController = require('../controllers/invoicingController');
const financeAlertsController = require('../controllers/financeAlertsController');
const financeAnalyticsController = require('../controllers/financeAnalyticsController');
const approvalsController = require('../controllers/approvalsController');
const { authenticateToken } = require('../../core/middleware');
const { validateRequest } = require('../../middleware/zodValidator');
const {
  getFinanceSummarySchema,
  getPaymentMethodSplitSchema,
  getLiveTransactionsSchema,
  getDailyMetricsSchema,
  getGatewayStatusSchema,
  getHourlyTrendsSchema,
  exportFinanceReportSchema,
  getCustomerPaymentsSchema,
  getCustomerPaymentDetailsSchema,
  retryCustomerPaymentSchema,
  getVendorInvoicesSchema,
  getVendorInvoiceDetailsSchema,
  approveInvoiceSchema,
  rejectInvoiceSchema,
  markInvoicePaidSchema,
  uploadInvoiceSchema,
  createPaymentSchema,
  getRefundQueueSchema,
  getRefundDetailsSchema,
  approveRefundSchema,
  rejectRefundSchema,
  getReconSummarySchema,
  getExceptionsSchema,
  runReconciliationSchema,
  getRunStatusSchema,
  investigateExceptionSchema,
  resolveExceptionSchema,
  getGatewayDetailsSchema,
  getLedgerEntriesSchema,
  createJournalEntrySchema,
  getJournalDetailsSchema,
  getInvoicesSchema,
  getInvoiceDetailsSchema,
  createInvoiceSchema,
  updateInvoiceStatusSchema,
  sendInvoiceSchema,
  sendReminderSchema,
  markInvoicePaidSchema2,
  getAlertsSchema,
  getAlertDetailsSchema,
  performAlertActionSchema,
  getRevenueGrowthSchema,
  getCashFlowSchema,
  getExpenseBreakdownSchema,
  exportAnalyticsReportSchema,
  getApprovalTasksSchema,
  getTaskDetailsSchema,
  submitTaskDecisionSchema,
} = require('../../validators/financeDashboardSchemas');

const router = Router();

// Import auth routes
const authRoutes = require('./authRoutes');

// Mount auth routes
router.use('/auth', authRoutes);

// Finance Overview routes
router.get('/summary', authenticateToken, validateRequest(getFinanceSummarySchema), financeDashboardController.getFinanceSummary);
router.get('/payment-method-split', authenticateToken, validateRequest(getPaymentMethodSplitSchema), financeDashboardController.getPaymentMethodSplit);
router.get('/live-transactions', authenticateToken, validateRequest(getLiveTransactionsSchema), financeDashboardController.getLiveTransactions);
router.get('/daily-metrics', authenticateToken, validateRequest(getDailyMetricsSchema), financeDashboardController.getDailyMetrics);
router.get('/gateway-status', authenticateToken, validateRequest(getGatewayStatusSchema), financeDashboardController.getGatewayStatus);
router.get('/hourly-trends', authenticateToken, validateRequest(getHourlyTrendsSchema), financeDashboardController.getHourlyTrends);
router.post('/export', authenticateToken, validateRequest(exportFinanceReportSchema), financeDashboardController.exportFinanceReport);

// Customer Payments routes
router.get('/customer-payments', authenticateToken, validateRequest(getCustomerPaymentsSchema), customerPaymentsController.getCustomerPayments);
router.get('/customer-payments/:id', authenticateToken, validateRequest(getCustomerPaymentDetailsSchema), customerPaymentsController.getCustomerPaymentDetails);
router.post('/customer-payments/:id/retry', authenticateToken, validateRequest(retryCustomerPaymentSchema), customerPaymentsController.retryCustomerPayment);

// Vendor Payments routes
router.get('/vendor-payments/summary', authenticateToken, vendorPaymentsController.getPayablesSummary);
router.get('/vendor-payments/invoices', authenticateToken, validateRequest(getVendorInvoicesSchema), vendorPaymentsController.getVendorInvoices);
router.post('/vendor-payments/invoices', authenticateToken, validateRequest(uploadInvoiceSchema), vendorPaymentsController.uploadInvoice);
router.get('/vendor-payments/invoices/:id', authenticateToken, validateRequest(getVendorInvoiceDetailsSchema), vendorPaymentsController.getVendorInvoiceDetails);
router.post('/vendor-payments/invoices/:id/approve', authenticateToken, validateRequest(approveInvoiceSchema), vendorPaymentsController.approveInvoice);
router.post('/vendor-payments/invoices/:id/reject', authenticateToken, validateRequest(rejectInvoiceSchema), vendorPaymentsController.rejectInvoice);
router.post('/vendor-payments/invoices/:id/mark-paid', authenticateToken, validateRequest(markInvoicePaidSchema), vendorPaymentsController.markInvoicePaid);
router.post('/vendor-payments/payments', authenticateToken, validateRequest(createPaymentSchema), vendorPaymentsController.createPayment);
router.get('/vendor-payments/vendors', authenticateToken, vendorPaymentsController.getVendors);

// Refunds routes
router.get('/refunds/summary', authenticateToken, refundsController.getRefundsSummary);
router.get('/refunds/queue', authenticateToken, validateRequest(getRefundQueueSchema), refundsController.getRefundQueue);
// Place specific routes before parameterized routes to avoid accidental param matching (e.g. "chargebacks" being treated as :id)
router.get('/refunds/chargebacks', authenticateToken, refundsController.getChargebacks);
router.get('/refunds/:id', authenticateToken, validateRequest(getRefundDetailsSchema), refundsController.getRefundDetails);
router.post('/refunds/:id/approve', authenticateToken, validateRequest(approveRefundSchema), refundsController.approveRefund);
router.post('/refunds/:id/reject', authenticateToken, validateRequest(rejectRefundSchema), refundsController.rejectRefund);

// Reconciliation routes
router.get('/reconciliation/summary', authenticateToken, validateRequest(getReconSummarySchema), reconciliationController.getReconSummary);
router.get('/reconciliation/exceptions', authenticateToken, validateRequest(getExceptionsSchema), reconciliationController.getExceptions);
router.post('/reconciliation/run', authenticateToken, validateRequest(runReconciliationSchema), reconciliationController.runReconciliation);
router.get('/reconciliation/runs/:id', authenticateToken, validateRequest(getRunStatusSchema), reconciliationController.getRunStatus);
router.post('/reconciliation/exceptions/:id/investigate', authenticateToken, validateRequest(investigateExceptionSchema), reconciliationController.investigateException);
router.post('/reconciliation/exceptions/:id/resolve', authenticateToken, validateRequest(resolveExceptionSchema), reconciliationController.resolveException);
router.get('/reconciliation/gateways/:id', authenticateToken, validateRequest(getGatewayDetailsSchema), reconciliationController.getGatewayDetails);

// Ledger routes
router.get('/ledger/summary', authenticateToken, accountingController.getAccountingSummary);
router.get('/ledger/entries', authenticateToken, validateRequest(getLedgerEntriesSchema), accountingController.getLedgerEntries);
router.get('/ledger/accounts', authenticateToken, accountingController.getAccounts);
router.post('/ledger/journal-entries', authenticateToken, validateRequest(createJournalEntrySchema), accountingController.createJournalEntry);
router.get('/ledger/journal-entries/:id', authenticateToken, validateRequest(getJournalDetailsSchema), accountingController.getJournalDetails);

// Invoicing routes
router.get('/invoices/summary', authenticateToken, invoicingController.getInvoiceSummary);
router.get('/invoices', authenticateToken, validateRequest(getInvoicesSchema), invoicingController.getInvoices);
router.post('/invoices', authenticateToken, validateRequest(createInvoiceSchema), invoicingController.createInvoice);
router.get('/invoices/:id', authenticateToken, validateRequest(getInvoiceDetailsSchema), invoicingController.getInvoiceDetails);
router.patch('/invoices/:id/status', authenticateToken, validateRequest(updateInvoiceStatusSchema), invoicingController.updateInvoiceStatus);
router.post('/invoices/:id/send', authenticateToken, validateRequest(sendInvoiceSchema), invoicingController.sendInvoice);
router.post('/invoices/:id/send-reminder', authenticateToken, validateRequest(sendReminderSchema), invoicingController.sendReminder);
router.post('/invoices/:id/mark-paid', authenticateToken, validateRequest(markInvoicePaidSchema2), invoicingController.markInvoicePaid);

// Finance Alerts routes
router.get('/alerts', authenticateToken, validateRequest(getAlertsSchema), financeAlertsController.getAlerts);
router.get('/alerts/:id', authenticateToken, validateRequest(getAlertDetailsSchema), financeAlertsController.getAlertDetails);
router.post('/alerts/:id/action', authenticateToken, validateRequest(performAlertActionSchema), financeAlertsController.performAlertAction);
router.post('/alerts/clear-resolved', authenticateToken, financeAlertsController.clearResolvedAlerts);

// Finance Analytics routes
router.get('/analytics/revenue-growth', authenticateToken, validateRequest(getRevenueGrowthSchema), financeAnalyticsController.getRevenueGrowth);
router.get('/analytics/cash-flow', authenticateToken, validateRequest(getCashFlowSchema), financeAnalyticsController.getCashFlow);
router.get('/analytics/expense-breakdown', authenticateToken, validateRequest(getExpenseBreakdownSchema), financeAnalyticsController.getExpenseBreakdown);
router.post('/analytics/export', authenticateToken, validateRequest(exportAnalyticsReportSchema), financeAnalyticsController.exportAnalyticsReport);

// Approvals routes
router.get('/approvals/summary', authenticateToken, approvalsController.getApprovalSummary);
router.get('/approvals/tasks', authenticateToken, validateRequest(getApprovalTasksSchema), approvalsController.getApprovalTasks);
router.get('/approvals/tasks/:id', authenticateToken, validateRequest(getTaskDetailsSchema), approvalsController.getTaskDetails);
router.post('/approvals/tasks/:id/decision', authenticateToken, validateRequest(submitTaskDecisionSchema), approvalsController.submitTaskDecision);

module.exports = router;
