
const Certificate = require('../models/Certificate');

async function listCertificatesByVendor(vendorId, query = {}) {
  const filter = {};
  if (vendorId) filter.vendorId = vendorId;
  if (query.status && query.status !== 'all') filter.status = query.status;
  const data = await Certificate.find(filter).lean();
  return data;
}

async function createCertificate(vendorId, payload, fileUrl) {
  const cert = new Certificate({
    vendorId,
    type: payload.type,
    issuedBy: payload.issuedBy,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
    status: payload.status || 'valid',
    fileUrl: fileUrl || payload.fileUrl,
    metadata: payload.metadata || {},
  });
  await cert.save();
  return cert.toObject();
}

async function getCertificateById(id) {
  const cert = await Certificate.findById(id).lean();
  if (!cert) {
    const err = new Error('Certificate not found');
    err.status = 404;
    throw err;
  }
  return cert;
}

async function revokeCertificate(id) {
  const cert = await Certificate.findById(id);
  if (!cert) {
    const err = new Error('Certificate not found');
    err.status = 404;
    throw err;
  }
  cert.status = 'revoked';
  await cert.save();
  return;
}

async function updateCertificate(id, payload) {
  console.log('updateCertificate called with:', { id, payload });
  
  const updateData = {};
  if (payload.status) {
    updateData.status = payload.status;
  }
  if (payload.expiresAt) {
    updateData.expiresAt = payload.expiresAt instanceof Date ? payload.expiresAt : new Date(payload.expiresAt);
  }
  if (payload.issuedAt) {
    updateData.issuedAt = payload.issuedAt instanceof Date ? payload.issuedAt : new Date(payload.issuedAt);
  }
  
  // Check if id is a valid MongoDB ObjectId
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  
  let updated = null;
  
  if (isValidObjectId) {
    // Use findByIdAndUpdate for atomic update
    try {
      updated = await Certificate.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
    } catch (err) {
      console.error('findByIdAndUpdate failed:', err);
      const mongoose = require('mongoose');
      updated = await Certificate.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: updateData },
        { new: true, runValidators: true }
      );
    }
  }
  
  // If not found by _id, try finding by id field
  if (!updated) {
    updated = await Certificate.findOneAndUpdate(
      { id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }
  
  if (!updated) {
    const err = new Error(`Certificate not found with ID: ${id}`);
    err.status = 404;
    throw err;
  }
  
  console.log('Certificate updated successfully:', {
    id: updated._id.toString(),
    status: updated.status
  });
  
  return updated.toObject();
}

module.exports = {
  listCertificatesByVendor,
  createCertificate,
  getCertificateById,
  revokeCertificate,
  updateCertificate,
};
