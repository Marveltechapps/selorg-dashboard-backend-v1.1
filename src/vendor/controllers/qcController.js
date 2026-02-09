
const qcService = require('../services/qcService');

async function listQCChecks(req, res, next) {
  try {
    const result = await qcService.listQCChecks(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function createQCCheck(req, res, next) {
  try {
    const check = await qcService.createQCCheck(req.body);
    res.status(201).json(check);
  } catch (err) {
    next(err);
  }
}

async function getQCCheck(req, res, next) {
  try {
    const c = await qcService.getQCCheckById(req.params.qcId);
    res.json(c);
  } catch (err) {
    next(err);
  }
}

async function patchQCCheck(req, res, next) {
  try {
    console.log('PATCH /qc/:qcId - Request:', {
      qcId: req.params.qcId,
      body: req.body
    });
    const c = await qcService.updateQCCheck(req.params.qcId, req.body);
    console.log('PATCH /qc/:qcId - Success:', {
      id: c._id?.toString() || c.id,
      status: c.status
    });
    res.json({
      success: true,
      data: c
    });
  } catch (err) {
    // Handle specific error cases
    if (err.status === 404) {
      return res.status(404).json({
        success: false,
        message: err.message || 'QC check not found',
      });
    }
    // Log error for debugging
    console.error('Error updating QC check:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to update QC check',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
}

async function overview(req, res, next) {
  try {
    res.json({ batchesCheckedToday: 0, passed: 0, failed: 0, passRate: 0, trend: [] });
  } catch (err) {
    next(err);
  }
}

module.exports = { listQCChecks, createQCCheck, getQCCheck, patchQCCheck, overview };
