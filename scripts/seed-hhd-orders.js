/**
 * Seed script: Push sample orders (and optional test user) into HHD DB for frontend testing.
 *
 * Prerequisites:
 * - Backend .env has MONGO_URI / MONGODB_URI pointing to the same DB as the HHD API.
 *
 * Usage (from repo root):
 *   node scripts/seed-hhd-orders.js
 *
 * Optional env:
 *   SEED_HHD_MOBILE=7418268091   Use this mobile for test user (default 7418268091).
 *   SEED_HHD_ORDERS_ONLY=1       Skip creating/ensuring test user; only seed orders (requires existing user).
 *   SEED_HHD_USER_ID=<_id>       When SEED_HHD_ORDERS_ONLY=1, use this MongoDB ObjectId as userId for orders.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const HHDUser = require('../src/hhd/models/User.model');
const HHDOrder = require('../src/hhd/models/Order.model');
const HHDCompletedOrder = require('../src/hhd/models/CompletedOrder.model');
const HHDItem = require('../src/hhd/models/Item.model');
const { ORDER_STATUS, ORDER_PRIORITY, ZONE } = require('../src/hhd/utils/constants');

const DEFAULT_TEST_MOBILE = '7418268091';
const TEST_USER_NAME = 'Test Picker';

const SAMPLE_ORDERS = [
  { orderId: 'ORD-SEED-001', zone: ZONE.A, itemCount: 8, targetTime: 28, priority: ORDER_PRIORITY.HIGH },
  { orderId: 'ORD-SEED-002', zone: ZONE.B, itemCount: 12, targetTime: 25, priority: ORDER_PRIORITY.MEDIUM },
  { orderId: 'ORD-SEED-003', zone: ZONE.C, itemCount: 5, targetTime: 15, priority: ORDER_PRIORITY.URGENT },
];

const SAMPLE_ITEMS_TEMPLATE = [
  { itemCode: 'SKU-001', name: 'Organic Bananas', quantity: 2, category: 'Fresh' },
  { itemCode: 'SKU-002', name: 'Whole Milk 1L', quantity: 1, category: 'Grocery' },
  { itemCode: 'SKU-003', name: 'Oats 500g', quantity: 1, category: 'Grocery' },
  { itemCode: 'SKU-004', name: 'Hand Sanitizer', quantity: 1, category: 'Care' },
  { itemCode: 'SKU-005', name: 'Chips Pack', quantity: 2, category: 'Snacks' },
];

function getSampleItemsForOrder(orderId, itemCount) {
  const items = [];
  const len = Math.min(itemCount, SAMPLE_ITEMS_TEMPLATE.length * 2);
  for (let i = 0; i < len; i++) {
    const t = SAMPLE_ITEMS_TEMPLATE[i % SAMPLE_ITEMS_TEMPLATE.length];
    items.push({
      orderId,
      itemCode: `${t.itemCode}-${i}`,
      name: t.name,
      quantity: t.quantity,
      category: t.category,
      status: 'pending',
    });
  }
  return items;
}

async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/selorg-admin-ops';
  await mongoose.connect(uri);
  console.log('MongoDB connected:', mongoose.connection.name);
}

async function ensureTestUser() {
  const mobile = process.env.SEED_HHD_MOBILE || DEFAULT_TEST_MOBILE;
  let user = await HHDUser.findOne({ mobile }).lean();
  if (user) {
    console.log('Using existing HHD user:', mobile, user.name || user._id);
    return user._id;
  }
  user = await HHDUser.create({
    mobile,
    name: TEST_USER_NAME,
    role: 'picker',
    deviceId: 'SEED-DEVICE-01',
    isActive: true,
  });
  console.log('Created HHD test user:', mobile, user.name);
  return user._id;
}

async function seedOrders(userId) {
  const orderIds = [];
  for (const o of SAMPLE_ORDERS) {
    const existing = await HHDOrder.findOne({ orderId: o.orderId });
    if (existing) {
      console.log('Order already exists, skipping:', o.orderId);
      orderIds.push(o.orderId);
      continue;
    }
    const order = await HHDOrder.create({
      orderId: o.orderId,
      userId,
      zone: o.zone,
      itemCount: o.itemCount,
      targetTime: o.targetTime,
      priority: o.priority || ORDER_PRIORITY.HIGH,
      status: ORDER_STATUS.PENDING,
    });
    orderIds.push(order.orderId);

    const items = getSampleItemsForOrder(order.orderId, o.itemCount);
    await HHDItem.insertMany(items);
    console.log('Created order', order.orderId, 'with', items.length, 'items');
  }
  return orderIds;
}

async function seedCompletedOrdersForToday(userId) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  for (let i = 0; i < 2; i++) {
    const orderId = `ORD-SEED-COMPLETED-${i + 1}`;
    const existing = await HHDCompletedOrder.findOne({ orderId });
    if (existing) {
      console.log('Completed order already exists, skipping:', orderId);
      continue;
    }
    const startedAt = new Date(startOfDay.getTime() + (i + 1) * 3600000);
    const completedAt = new Date(startedAt.getTime() + (4 + i) * 60 * 1000); // 4–5 min pick time
    await HHDCompletedOrder.create({
      orderId,
      userId,
      zone: ZONE.A,
      status: ORDER_STATUS.COMPLETED,
      itemCount: 5,
      targetTime: 28,
      pickTime: (4 + i) + (30 / 60), // minutes
      bagId: `BAG-${i + 1}`,
      rackLocation: `Rack D1-Slot ${i + 1}`,
      riderName: 'Rider Test',
      startedAt,
      completedAt,
    });
    console.log('Created completed order for today:', orderId);
  }
}

async function run() {
  try {
    await connectDB();

    let userId;
    if (process.env.SEED_HHD_ORDERS_ONLY === '1' && process.env.SEED_HHD_USER_ID) {
      userId = new mongoose.Types.ObjectId(process.env.SEED_HHD_USER_ID);
      console.log('Using provided SEED_HHD_USER_ID for orders');
    } else {
      userId = await ensureTestUser();
    }

    await seedOrders(userId);
    await seedCompletedOrdersForToday(userId);

    console.log('\nDone. To test in the HHD app:');
    console.log('  1. Log in with mobile', process.env.SEED_HHD_MOBILE || DEFAULT_TEST_MOBILE);
    console.log('  2. Complete OTP; you should see pending orders on the Order Received screen.');
    console.log('  3. Dashboard home will show today’s completed count if you ran completed-order seed.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

run();
