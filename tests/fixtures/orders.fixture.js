/**
 * Order test fixtures
 */

const sampleOrder = {
  orderId: 'ORD-001',
  customerId: 'CUST-001',
  customerName: 'Test Customer',
  items: [
    {
      sku: 'SKU-001',
      name: 'Test Product',
      quantity: 2,
      price: 100,
    },
  ],
  total: 200,
  status: 'pending',
  deliveryAddress: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
  },
};

const sampleOrders = [
  sampleOrder,
  {
    ...sampleOrder,
    orderId: 'ORD-002',
    status: 'processing',
  },
  {
    ...sampleOrder,
    orderId: 'ORD-003',
    status: 'completed',
  },
];

module.exports = {
  sampleOrder,
  sampleOrders,
};