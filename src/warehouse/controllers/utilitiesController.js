const utilitiesService = require('../services/utilitiesService');
const { asyncHandler } = require('../../core/middleware');

/**
 * @desc Warehouse Utilities Controller
 */
const utilitiesController = {
  uploadSKUs: asyncHandler(async (req, res) => {
    const result = await utilitiesService.uploadSKUs(req.body);
    res.status(200).json({ success: true, ...result });
  }),

  getLogs: asyncHandler(async (req, res) => {
    const logs = await utilitiesService.getAccessLogs(req.query);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  }),

  generateLabels: asyncHandler(async (req, res) => {
    const result = await utilitiesService.generateLabels(req.body);
    res.status(200).json({ success: true, ...result });
  }),

  reassignBins: asyncHandler(async (req, res) => {
    const result = await utilitiesService.reassignBins(req.body);
    res.status(200).json({ success: true, ...result });
  }),

  printBarcodes: asyncHandler(async (req, res) => {
    const result = await utilitiesService.printBarcodes(req.body);
    res.status(200).json({ success: true, ...result });
  })
};

module.exports = utilitiesController;

