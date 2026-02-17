/**
 * User service – from backend-workflow.yaml (user_profile_upsert, location_type_set, upi_upsert).
 * When user is linked to HHD (hhdUserId), profile includes linkedHhdProfile for same-person context.
 */
const mongoose = require('mongoose');
const User = require('../models/user.model');
const HHDUser = require('../../hhd/models/User.model');

const updateProfile = async (userId, body) => {
  const set = {};
  if (body.name != null) set.name = body.name;
  if (body.age != null) set.age = body.age;
  if (body.gender != null) set.gender = body.gender;
  if (body.photoUri != null) set.photoUri = body.photoUri;
  if (body.email != null) set.email = body.email;
  if (body.phone != null) set.phone = body.phone;
  const user = await User.findByIdAndUpdate(userId, { $set: set }, { new: true }).lean();
  return user || null;
};

const setLocationType = async (userId, locationType) => {
  if (!['warehouse', 'darkstore'].includes(locationType)) return null;
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { locationType } },
    { new: true }
  ).lean();
  return user || null;
};

const setSelectedShifts = async (userId, selectedShifts) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { selectedShifts: selectedShifts || [] } },
    { new: true }
  ).lean();
  return user || null;
};

const setUpi = async (userId, upiId, upiName) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { upiId, upiName } },
    { new: true }
  ).lean();
  return user || null;
};

const getById = async (userId) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;
  return User.findById(userId).lean();
};

/** GET profile: return current user profile for app display; include linked HHD profile when same person. */
const getProfile = async (userId) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;
  const user = await User.findById(userId).lean();
  if (!user) return null;
  const profile = {
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    email: user.email,
    age: user.age,
    gender: user.gender,
    photoUri: user.photoUri,
    createdAt: user.createdAt,
    selectedShifts: user.selectedShifts || [],
    locationType: user.locationType,
    trainingProgress: user.trainingProgress || {},
    upiId: user.upiId,
    upiName: user.upiName,
  };
  if (user.hhdUserId) {
    try {
      const hhd = await HHDUser.findById(user.hhdUserId).select('name mobile').lean();
      if (hhd) profile.linkedHhdProfile = { name: hhd.name, mobile: hhd.mobile };
    } catch (_) {}
  }
  return profile;
};

/** Link status for same-person context (Picker ↔ HHD). */
const getLinkStatus = async (userId) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return { linked: false };
  const user = await User.findById(userId).select('hhdUserId').lean();
  return {
    linked: !!user?.hhdUserId,
    hhdUserId: user?.hhdUserId?.toString() || null,
  };
};

/** Contract info (shared DB single source). */
const getContract = async (userId) => {
  const user = await User.findById(userId).select('contractInfo').lean();
  return user?.contractInfo || {};
};

const updateContract = async (userId, body) => {
  const set = {};
  if (body.legalName != null) set['contractInfo.legalName'] = body.legalName;
  if (body.contractStartDate != null) set['contractInfo.contractStartDate'] = body.contractStartDate;
  if (body.documentId != null) set['contractInfo.documentId'] = body.documentId;
  await User.updateOne({ _id: userId }, { $set: set });
  return getContract(userId);
};

/** Employment details (shared DB single source). */
const getEmployment = async (userId) => {
  const user = await User.findById(userId).select('employment').lean();
  return user?.employment || {};
};

const updateEmployment = async (userId, body) => {
  const set = {};
  const keys = ['joiningDate', 'role', 'shiftType', 'employerName', 'employeeId', 'department'];
  keys.forEach((k) => {
    if (body[k] !== undefined) set[`employment.${k}`] = body[k];
  });
  await User.updateOne({ _id: userId }, { $set: set });
  return getEmployment(userId);
};

module.exports = {
  updateProfile,
  setLocationType,
  setSelectedShifts,
  setUpi,
  getById,
  getProfile,
  getLinkStatus,
  getContract,
  updateContract,
  getEmployment,
  updateEmployment,
};
