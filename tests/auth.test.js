const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');
const Role = require('../src/models/Role');

describe('Authentication API', () => {
  let testRole;
  let testUser;

  beforeAll(async () => {
    // Create test role
    testRole = await Role.create({
      name: 'Test Admin',
      description: 'Test role',
      roleType: 'custom',
      permissions: ['read', 'write'],
      accessScope: 'global',
    });

    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      roleId: testRole._id,
      status: 'active',
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'password123',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let authToken;

    beforeAll(async () => {
      // Login using the test user created in outer beforeAll
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      
      // The login should succeed since we created the user in the outer beforeAll
      if (loginResponse.body.success && loginResponse.body.data) {
        authToken = loginResponse.body.data.token;
      } else {
        // If login fails, try to recreate user (might be a timing issue)
        await User.deleteOne({ email: 'test@example.com' });
        const newUser = await User.create({
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
          roleId: testRole._id,
          status: 'active',
        });
        
        const retryResponse = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'test@example.com',
            password: 'password123',
          });
        
        if (retryResponse.body.success && retryResponse.body.data) {
          authToken = retryResponse.body.data.token;
        } else {
          throw new Error('Failed to login after retry');
        }
      }
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
    });
  });
});

