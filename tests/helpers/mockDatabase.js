/**
 * Database mocking utilities for tests
 */

const mongoose = require('mongoose');

/**
 * Clear all collections in the test database
 */
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * Drop all collections
 */
const dropDatabase = async () => {
  await mongoose.connection.dropDatabase();
};

/**
 * Get collection count
 */
const getCollectionCount = async (collectionName) => {
  return await mongoose.connection.collection(collectionName).countDocuments();
};

module.exports = {
  clearDatabase,
  dropDatabase,
  getCollectionCount,
};