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

module.exports = { getAddressesByUserId, getDefaultAddress };
