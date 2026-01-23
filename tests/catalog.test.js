const request = require('supertest');
const app = require('../src/server');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const User = require('../src/models/User');
const Role = require('../src/models/Role');

describe('Catalog Management API', () => {
  let authToken;
  let testCategory;
  let testUser;

  beforeAll(async () => {
    // Create test role and user
    const testRole = await Role.create({
      name: 'Catalog Admin',
      description: 'Catalog admin role',
      roleType: 'custom',
      permissions: ['read', 'write'],
      accessScope: 'global',
    });

    testUser = await User.create({
      email: 'catalog@test.com',
      name: 'Catalog Admin',
      password: 'password123',
      roleId: testRole._id,
      status: 'active',
    });

    // Login
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'catalog@test.com',
        password: 'password123',
      });
    authToken = loginResponse.body.data.token;

    // Create test category
    testCategory = await Category.create({
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test category description',
      status: 'active',
      parentId: null,
      sortOrder: 1,
      imageUrl: '',
      productCount: 0,
    });
  });

  afterAll(async () => {
    await Product.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    await Role.deleteMany({});
  });

  describe('GET /api/v1/admin/catalog/products', () => {
    it('should get all products', async () => {
      const response = await request(app)
        .get('/api/v1/admin/catalog/products')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/admin/catalog/products', () => {
    it('should create a new product', async () => {
      const response = await request(app)
        .post('/api/v1/admin/catalog/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: 'TEST-001',
          name: 'Test Product',
          description: 'Test product description',
          category: testCategory._id.toString(),
          brand: 'Test Brand',
          price: 100,
          costPrice: 50,
          imageUrl: 'https://example.com/image.jpg',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Product');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/admin/catalog/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Incomplete Product',
        });

      expect(response.status).toBe(400);
    });
  });
});

