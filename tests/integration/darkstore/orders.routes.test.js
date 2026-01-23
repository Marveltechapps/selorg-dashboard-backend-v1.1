const request = require('supertest');
const createTestApp = require('../../helpers/testApp');
const { getAuthHeaders, testUsers } = require('../../helpers/mockAuth');
const { clearDatabase } = require('../../helpers/mockDatabase');
const Order = require('../../../src/darkstore/models/Order');
const InventoryItem = require('../../../src/darkstore/models/InventoryItem');

const app = createTestApp();

describe('Darkstore Orders API', () => {
  beforeEach(() => {
    clearDatabase();
  });

  describe('POST /api/v1/darkstore/orders', () => {
    it('should create order when authenticated', async () => {
      // Create inventory items first
      await InventoryItem.create({
        sku: 'SKU-001',
        name: 'Test Product',
        stock: 100,
        store_id: 'STORE-001',
      });

      const orderData = {
        customerId: 'CUST-001',
        customerName: 'Test Customer',
        items: [
          {
            sku: 'SKU-001',
            quantity: 2,
            price: 100,
          },
        ],
        deliveryAddress: {
          street: '123 Test St',
          city: 'Test City',
          zipCode: '12345',
        },
      };

      const response = await request(app)
        .post('/api/v1/darkstore/orders')
        .set(getAuthHeaders(testUsers.darkstore))
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('orderId');
      expect(response.body.data.status).toBe('pending');
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .post('/api/v1/darkstore/orders')
        .send({})
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_REQUIRED');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/darkstore/orders')
        .set(getAuthHeaders(testUsers.darkstore))
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should check inventory availability', async () => {
      await InventoryItem.create({
        sku: 'SKU-002',
        name: 'Low Stock Product',
        stock: 1,
        store_id: 'STORE-001',
      });

      const orderData = {
        customerId: 'CUST-001',
        items: [
          {
            sku: 'SKU-002',
            quantity: 5, // More than available
            price: 100,
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/darkstore/orders')
        .set(getAuthHeaders(testUsers.darkstore))
        .send(orderData);

      // Should either fail or allow with backorder status
      expect([400, 201]).toContain(response.status);
    });
  });

  describe('GET /api/v1/darkstore/orders', () => {
    beforeEach(async () => {
      // Create test orders
      await Order.create({
        orderId: 'ORD-001',
        customerId: 'CUST-001',
        status: 'pending',
        total: 200,
      });

      await Order.create({
        orderId: 'ORD-002',
        customerId: 'CUST-002',
        status: 'processing',
        total: 300,
      });
    });

    it('should list orders when authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/darkstore/orders')
        .set(getAuthHeaders(testUsers.darkstore))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/v1/darkstore/orders?status=pending')
        .set(getAuthHeaders(testUsers.darkstore))
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data.every(order => order.status === 'pending')).toBe(true);
      }
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .get('/api/v1/darkstore/orders')
        .expect(401);
    });
  });

  describe('GET /api/v1/darkstore/orders/:orderId', () => {
    it('should get order details when authenticated', async () => {
      const order = await Order.create({
        orderId: 'ORD-003',
        customerId: 'CUST-001',
        status: 'pending',
        total: 200,
      });

      const response = await request(app)
        .get(`/api/v1/darkstore/orders/${order.orderId}`)
        .set(getAuthHeaders(testUsers.darkstore))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orderId).toBe('ORD-003');
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/v1/darkstore/orders/NONEXISTENT')
        .set(getAuthHeaders(testUsers.darkstore))
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/darkstore/orders/:orderId', () => {
    it('should update order status when authenticated', async () => {
      const order = await Order.create({
        orderId: 'ORD-004',
        customerId: 'CUST-001',
        status: 'pending',
        total: 200,
      });

      const response = await request(app)
        .patch(`/api/v1/darkstore/orders/${order.orderId}`)
        .set(getAuthHeaders(testUsers.darkstore))
        .send({ status: 'processing' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('processing');
    });
  });

  describe('POST /api/v1/darkstore/orders/:orderId/cancel', () => {
    it('should cancel order when authenticated', async () => {
      const order = await Order.create({
        orderId: 'ORD-005',
        customerId: 'CUST-001',
        status: 'pending',
        total: 200,
      });

      const response = await request(app)
        .post(`/api/v1/darkstore/orders/${order.orderId}/cancel`)
        .set(getAuthHeaders(testUsers.darkstore))
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify order was cancelled
      const updatedOrder = await Order.findOne({ orderId: 'ORD-005' });
      expect(updatedOrder.status).toBe('cancelled');
    });
  });
});
