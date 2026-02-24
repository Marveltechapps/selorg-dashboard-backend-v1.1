const mongoose = require('mongoose');
const { CustomerAddress } = require('../models/CustomerAddress');

/**
 * List all addresses for a user, ordered by order then createdAt.
 */
async function getAddressesByUserId(userId) {
  const addresses = await CustomerAddress.find({ userId })
    .sort({ order: 1, createdAt: 1 })
    .lean();
  return addresses;
}

/**
 * Get the default address for a user (isDefault: true), or the first address if none marked default.
 */
async function getDefaultAddress(userId) {
  let address = await CustomerAddress.findOne({ userId, isDefault: true }).lean();
  if (!address) {
    address = await CustomerAddress.findOne({ userId }).sort({ order: 1, createdAt: 1 }).lean();
  }
  return address;
}

/**
 * Create a new address for a user.
 */
async function createAddress(userId, body) {
  const { label, line1, line2, city, state, pincode, isDefault } = body;
  const count = await CustomerAddress.countDocuments({ userId });
  const doc = await CustomerAddress.create({
    userId: new mongoose.Types.ObjectId(userId),
    label: label || 'Home',
    line1: line1 || '',
    line2: line2 || '',
    city: city || '',
    state: state || '',
    pincode: pincode || '',
    isDefault: Boolean(isDefault),
    order: count,
  });
  if (isDefault) {
    await CustomerAddress.updateMany(
      { userId, _id: { $ne: doc._id } },
      { $set: { isDefault: false } }
    );
  }
  return doc.toObject ? doc.toObject() : doc;
}

/**
 * Update an address. Only the owning user can update.
 */
async function updateAddress(userId, addressId, body) {
  const address = await CustomerAddress.findOne({ _id: addressId, userId });
  if (!address) return null;
  const { label, line1, line2, city, state, pincode, isDefault } = body;
  if (label !== undefined) address.label = label;
  if (line1 !== undefined) address.line1 = line1;
  if (line2 !== undefined) address.line2 = line2;
  if (city !== undefined) address.city = city;
  if (state !== undefined) address.state = state;
  if (pincode !== undefined) address.pincode = pincode;
  if (isDefault !== undefined) {
    address.isDefault = Boolean(isDefault);
    if (address.isDefault) {
      await CustomerAddress.updateMany(
        { userId, _id: { $ne: addressId } },
        { $set: { isDefault: false } }
      );
    }
  }
  await address.save();
  return address.toObject ? address.toObject() : address;
}

/**
 * Delete an address. Only the owning user can delete.
 */
async function deleteAddress(userId, addressId) {
  const result = await CustomerAddress.findOneAndDelete({ _id: addressId, userId });
  return result;
}

/**
 * Set an address as default. Only the owning user.
 */
async function setDefaultAddress(userId, addressId) {
  const address = await CustomerAddress.findOne({ _id: addressId, userId });
  if (!address) return null;
  await CustomerAddress.updateMany({ userId }, { $set: { isDefault: false } });
  address.isDefault = true;
  await address.save();
  return address.toObject ? address.toObject() : address;
}

module.exports = {
  getAddressesByUserId,
  getDefaultAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
