
const QCCheck = require('../models/QCCheck');

async function listQCChecks(query) {
  const page = Math.max(1, parseInt(query.page || 1));
  const perPage = Math.max(1, parseInt(query.perPage || 25));
  const filter = {};
  if (query.vendorId) filter.vendorId = query.vendorId;
  if (query.status && query.status !== 'all') filter.status = query.status;
  const total = await QCCheck.countDocuments(filter);
  const data = await QCCheck.find(filter).skip((page - 1) * perPage).limit(perPage).lean();
  return { pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) }, data };
}

async function createQCCheck(payload) {
  const check = new QCCheck(payload);
  await check.save();
  return check.toObject();
}

async function getQCCheckById(id) {
  const c = await QCCheck.findById(id).lean();
  if (!c) {
    const err = new Error('QC check not found');
    err.status = 404;
    throw err;
  }
  return c;
}

async function updateQCCheck(id, payload) {
  console.log('updateQCCheck called with:', { id, payload });
  
  // Build update object
  const updateData = {};
  
  // Map frontend status values to backend values
  if (payload.status) {
    const statusMap = {
      'approved': 'approved',
      'rejected': 'rejected',
      'appealed': 'appealed',
      'pending': 'pending',
      'passed': 'approved',
      'failed': 'rejected',
    };
    const mappedStatus = statusMap[payload.status.toLowerCase()];
    updateData.status = mappedStatus || payload.status.toLowerCase();
  }
  
  // Note: QCCheck model doesn't have a 'result' field, so we only use status
  // Map result to status if status is not provided
  if (payload.result && !payload.status) {
    if (payload.result === 'Pass') {
      updateData.status = 'approved';
    } else if (payload.result === 'Fail') {
      updateData.status = 'rejected';
    }
  }
  
  if (payload.notes) {
    updateData.notes = payload.notes;
  }
  
  // Check if id is a valid MongoDB ObjectId (24 hex characters)
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  
  let updated = null;
  
  if (isValidObjectId) {
    // Use findByIdAndUpdate for atomic update
    try {
      updated = await QCCheck.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
    } catch (err) {
      console.error('findByIdAndUpdate failed:', err);
      // Fallback to findOneAndUpdate
      const mongoose = require('mongoose');
      updated = await QCCheck.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: updateData },
        { new: true, runValidators: true }
      );
    }
  }
  
  // If not found by _id, try finding by batchId
  if (!updated) {
    updated = await QCCheck.findOneAndUpdate(
      { batchId: id },
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }
  
  if (!updated) {
    // Provide a more helpful error message
    const err = new Error(`QC check not found with ID: ${id}. Please ensure you're using a valid MongoDB ObjectId or the check exists in the database.`);
    err.status = 404;
    throw err;
  }
  
  console.log('QC check updated successfully:', {
    id: updated._id.toString(),
    status: updated.status,
    batchId: updated.batchId
  });
  
  return updated.toObject();
}

module.exports = { listQCChecks, createQCCheck, getQCCheckById, updateQCCheck };
