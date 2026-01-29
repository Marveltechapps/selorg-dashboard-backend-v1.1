/**
 * Authentication mocking utilities for tests
 */

const jwt = require('jsonwebtoken');

const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-minimum-32-characters-long';

/**
 * Generate a test JWT token
 */
const generateTestToken = (payload = {}) => {
  const defaultPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    roleId: 'test-role',
    role: 'test',
    permissions: ['*'],
    ...payload,
  };

  return jwt.sign(defaultPayload, TEST_JWT_SECRET, { expiresIn: '1h' });
};

/**
 * Generate auth headers for test requests
 */
const getAuthHeaders = (payload) => {
  const token = generateTestToken(payload);
  return {
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Test user payloads for different roles
 */
const testUsers = {
  admin: {
    userId: 'admin-user-id',
    email: 'admin@selorg.com',
    roleId: 'admin',
    role: 'admin',
    permissions: ['*'],
  },
  darkstore: {
    userId: 'darkstore-user-id',
    email: 'darkstore@selorg.com',
    roleId: 'darkstore',
    role: 'darkstore',
    permissions: ['darkstore:*'],
  },
  finance: {
    userId: 'finance-user-id',
    email: 'finance@selorg.com',
    roleId: 'finance',
    role: 'finance',
    permissions: ['finance:*'],
  },
  vendor: {
    userId: 'vendor-user-id',
    email: 'vendor@selorg.com',
    roleId: 'vendor',
    role: 'vendor',
    permissions: ['vendor:*'],
  },
};

module.exports = {
  generateTestToken,
  getAuthHeaders,
  testUsers,
};