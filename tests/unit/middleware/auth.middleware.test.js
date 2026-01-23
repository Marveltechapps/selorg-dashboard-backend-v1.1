// Mock logger to prevent errors - must be before require
jest.mock('../../../src/core/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

const { authenticateToken, requireRole, requirePermission } = require('../../../src/core/middleware/auth.middleware');
const jwt = require('jsonwebtoken');

// Mock request, response, next
const mockRequest = (headers = {}, user = null) => ({
  headers,
  user,
  id: 'test-request-id',
  path: '/test',
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Auth Middleware', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should reject request without token', () => {
      const req = mockRequest();
      const res = mockResponse();
      
      authenticateToken(req, res, mockNext);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      const req = mockRequest({
        authorization: 'Bearer invalid-token',
      });
      const res = mockResponse();
      
      authenticateToken(req, res, mockNext);
      
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should accept valid token and attach user', () => {
      const token = jwt.sign(
        { userId: 'user-123', email: 'test@example.com', roleId: 'admin' },
        process.env.JWT_SECRET
      );
      
      const req = mockRequest({
        authorization: `Bearer ${token}`,
      });
      const res = mockResponse();
      
      authenticateToken(req, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('user-123');
    });
  });

  describe('requireRole', () => {
    it('should reject unauthenticated user', () => {
      const req = mockRequest();
      const res = mockResponse();
      const middleware = requireRole(['admin']);
      
      middleware(req, res, mockNext);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject user without required role', () => {
      const req = mockRequest({}, { userId: 'user-123', roleId: 'user' });
      const res = mockResponse();
      const middleware = requireRole(['admin']);
      
      middleware(req, res, mockNext);
      
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should accept user with required role', () => {
      const req = mockRequest({}, { userId: 'user-123', roleId: 'admin', role: 'admin' });
      const res = mockResponse();
      const middleware = requireRole(['admin']);
      
      middleware(req, res, mockNext);
      
      // If res.status was called, it means access was denied
      if (res.status.mock.calls.length > 0) {
        console.log('Access denied - status called with:', res.status.mock.calls[0][0]);
        console.log('JSON response:', res.json.mock.calls[0] ? res.json.mock.calls[0][0] : 'none');
      }
      
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
