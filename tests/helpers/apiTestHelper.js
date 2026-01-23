/**
 * API test helper utilities
 * Wraps Supertest with authentication and common test patterns
 */

const request = require('supertest');
const { getAuthHeaders } = require('./mockAuth');

/**
 * Create an authenticated request
 */
const authenticatedRequest = (app, method, path, userPayload) => {
  const headers = getAuthHeaders(userPayload);
  const req = request(app)[method](path).set(headers);
  return req;
};

/**
 * Create an unauthenticated request
 */
const unauthenticatedRequest = (app, method, path) => {
  return request(app)[method](path);
};

/**
 * Expect standard success response
 */
const expectSuccessResponse = (res) => {
  expect(res.status).toBeGreaterThanOrEqual(200);
  expect(res.status).toBeLessThan(300);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('data');
  expect(res.body).toHaveProperty('meta');
  expect(res.body.meta).toHaveProperty('requestId');
  expect(res.body.meta).toHaveProperty('timestamp');
};

/**
 * Expect standard error response
 */
const expectErrorResponse = (res, expectedStatusCode) => {
  if (expectedStatusCode) {
    expect(res.status).toBe(expectedStatusCode);
  }
  expect(res.body).toHaveProperty('success', false);
  expect(res.body).toHaveProperty('error');
  expect(res.body.error).toHaveProperty('code');
  expect(res.body.error).toHaveProperty('message');
  expect(res.body).toHaveProperty('meta');
};

/**
 * Expect paginated response
 */
const expectPaginatedResponse = (res) => {
  expectSuccessResponse(res);
  expect(res.body).toHaveProperty('pagination');
  expect(res.body.pagination).toHaveProperty('page');
  expect(res.body.pagination).toHaveProperty('limit');
  expect(res.body.pagination).toHaveProperty('total');
  expect(res.body.pagination).toHaveProperty('totalPages');
};

module.exports = {
  authenticatedRequest,
  unauthenticatedRequest,
  expectSuccessResponse,
  expectErrorResponse,
  expectPaginatedResponse,
};