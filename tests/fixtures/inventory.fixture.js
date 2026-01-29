/**
 * Inventory test fixtures
 */

const sampleInventoryItem = {
  sku: 'SKU-001',
  name: 'Test Product',
  category: 'Electronics',
  stock: 100,
  location: 'A1-B2-C3',
  store_id: 'STORE-001',
  zone: 'Zone 1 (Ambient)',
  aisle: 'A1',
  shelf: 'B2',
  position: 'C3',
  status: 'active',
  price: 100,
  cost: 50,
};

const sampleInventoryItems = [
  sampleInventoryItem,
  {
    ...sampleInventoryItem,
    sku: 'SKU-002',
    name: 'Test Product 2',
    stock: 50,
    location: 'A2-B3-C4',
  },
  {
    ...sampleInventoryItem,
    sku: 'SKU-003',
    name: 'Test Product 3',
    stock: 0,
    status: 'out_of_stock',
  },
];

const sampleInventoryAdjustment = {
  sku: 'SKU-001',
  store_id: 'STORE-001',
  action: 'adjust',
  quantity: -10,
  reason: 'Damaged goods',
  adjusted_by: 'test-user-id',
  notes: 'Test adjustment',
};

module.exports = {
  sampleInventoryItem,
  sampleInventoryItems,
  sampleInventoryAdjustment,
};