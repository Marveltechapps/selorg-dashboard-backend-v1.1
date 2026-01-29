const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');
const Role = require('../src/models/Role');

describe('User Management API', () => {
  let authToken;
  let testRole;
  let adminUser;

  beforeAll(async () => {
    // Create test role
    testRole = await Role.create({
      name: 'Admin Role',
      description: 'Admin role for testing',
      roleType: 'custom',
      permissions: ['read', 'write', 'delete'],
      accessScope: 'global',
    });

    // Create admin user
    adminUser = await User.create({
      email: 'admin@test.com',
      name: 'Admin User',
      password: 'password123',
      roleId: testRole._id,
      status: 'active',
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123',
      });
    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
  });

  describe('GET /api/v1/admin/users', () => {
    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter users by status', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users?status=active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/admin/users', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newuser@test.com',
          name: 'New User',
          roleId: testRole._id.toString(),
          department: 'IT',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('newuser@test.com');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email',
          name: 'Test User',
          roleId: testRole._id.toString(),
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/admin/users/:userId', () => {
    it('should get user by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/admin/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('admin@test.com');
    });
  });
});

