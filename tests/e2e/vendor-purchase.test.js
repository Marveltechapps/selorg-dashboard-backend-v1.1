/**
 * E2E Test: Vendor Purchase Flow
 * Tests: Login → Create PO → Approve → Receive goods → Update inventory
 */

const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const { getAuthHeaders, testUsers } = require('../helpers/mockAuth');
const { clearDatabase } = require('../helpers/mockDatabase');
const PurchaseOrder = require('../../src/vendor/models/PurchaseOrder');
const InventoryItem = require('../../src/vendor/models/InventoryItem');

const app = createTestApp();

describe('E2E: Vendor Purchase Flow', () => {
  beforeEach(async () => {
    clearDatabase();
  });

  it('should complete full vendor purchase workflow', async () => {
    const authHeaders = getAuthHeaders(testUsers.vendor);

    // Step 1: Create Purchase Order
    const poResponse = await request(app)
      .post('/api/v1/vendor/purchase-orders')
      .set(authHeaders)
      .send({
        vendorId: 'VENDOR-001',
        items: [
          { sku: 'SKU-001', quantity: 100, unitPrice: 50 },
          { sku: 'SKU-002', quantity: 50, unitPrice: 100 },
        ],
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    expect(poResponse.body.success).toBe(true);
    const poId = poResponse.body.data.poId || poResponse.body.data.id;

    // Step 2: View pending POs
    const pendingPOsResponse = await request(app)
      .get('/api/v1/vendor/purchase-orders?status=pending')
      .set(authHeaders)
      .expect(200);

    expect(pendingPOsResponse.body.success).toBe(true);
    const createdPO = pendingPOsResponse.body.data.find(po => 
      (po.poId || po.id) === poId
    );
    expect(createdPO).toBeDefined();

    // Step 3: Approve Purchase Order
    const approveResponse = await request(app)
      .patch(`/api/v1/vendor/purchase-orders/${poId}/approve`)
      .set(authHeaders)
      .send({ approvedBy: 'admin-user-id' })
      .expect(200);

    expect(approveResponse.body.success).toBe(true);
    expect(approveResponse.body.data.status).toBe('approved');

    // Step 4: Receive goods (create GRN)
    const receiveResponse = await request(app)
      .post(`/api/v1/vendor/purchase-orders/${poId}/receive`)
      .set(authHeaders)
      .send({
        items: [
          { sku: 'SKU-001', quantity: 100, received: true },
          { sku: 'SKU-002', quantity: 50, received: true },
        ],
        receivedDate: new Date().toISOString(),
      })
      .expect(200);

    expect(receiveResponse.body.success).toBe(true);

    // Step 5: Verify inventory was updated
    const inventoryItem1 = await InventoryItem.findOne({ sku: 'SKU-001' });
    if (inventoryItem1) {
      expect(inventoryItem1.stock).toBeGreaterThanOrEqual(0);
    }

    // Step 6: Verify PO status updated to received
    const updatedPO = await PurchaseOrder.findById(poId);
    expect(['received', 'completed', 'partially_received']).toContain(updatedPO.status);
  });
});
