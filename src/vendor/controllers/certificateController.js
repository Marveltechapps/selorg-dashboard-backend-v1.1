
const certificateService = require('../services/certificateService');

async function listVendorCertificates(req, res, next) {
  try {
    const vendorId = req.params.vendorId;
    const data = await certificateService.listCertificatesByVendor(vendorId, req.query);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function createVendorCertificate(req, res, next) {
  try {
    const vendorId = req.params.vendorId;
    // file handling: if multer stored file, it will be on req.file
    const fileUrl = req.file && req.file.path;
    const created = await certificateService.createCertificate(vendorId, req.body, fileUrl);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

async function getCertificate(req, res, next) {
  try {
    const cert = await certificateService.getCertificateById(req.params.certificateId);
    res.json(cert);
  } catch (err) {
    next(err);
  }
}

async function deleteCertificate(req, res, next) {
  try {
    await certificateService.revokeCertificate(req.params.certificateId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function updateCertificate(req, res, next) {
  try {
    const cert = await certificateService.updateCertificate(req.params.certificateId, req.body);
    res.json(cert);
  } catch (err) {
    // Handle specific error cases
    if (err.status === 404) {
      return res.status(404).json({
        success: false,
        message: err.message || 'Certificate not found',
      });
    }
    // Log error for debugging
    console.error('Error updating certificate:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to update certificate',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
}

module.exports = {
  listVendorCertificates,
  createVendorCertificate,
  getCertificate,
  deleteCertificate,
  updateCertificate,
};
