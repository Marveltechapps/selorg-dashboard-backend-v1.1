/**
 * Seed fresh orders data for Live Order Board
 * This script deletes all existing orders and creates new ones
 * Run: node src/seed-orders-fresh.js (from backend root; set MONGO_URI in .env)
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');

const Order = require('./warehouse/models/Order');
const Rider = require('./rider/models/Rider');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/selorg-admin-ops';

async function connect() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

async function seedFreshOrders() {
  await connect();

  const now = new Date();
  
  // Step 1: Delete all existing orders
  console.log('🗑️  Deleting all existing orders...');
  const deleteResult = await Order.deleteMany({});
  console.log(`   Deleted ${deleteResult.deletedCount} orders`);

  // Step 2: Ensure riders exist (create if they don't)
  console.log('👥 Ensuring riders exist...');
  const ridersData = [
    { id: 'RIDER-0001', rider_id: 'RIDER-0001', name: 'Raj Kumar', avatarInitials: 'RK', status: 'online', currentOrderId: null, location: { lat: 13.0827, lng: 80.2707 }, capacity: { currentLoad: 0, maxLoad: 4 }, avgEtaMins: 12, rating: 4.8, zone: 'Central' },
    { id: 'RIDER-0002', rider_id: 'RIDER-0002', name: 'Priya M', avatarInitials: 'PM', status: 'online', currentOrderId: null, location: { lat: 13.09, lng: 80.28 }, capacity: { currentLoad: 0, maxLoad: 4 }, avgEtaMins: 8, rating: 4.6, zone: 'North' },
    { id: 'RIDER-0003', rider_id: 'RIDER-0003', name: 'Amit S', avatarInitials: 'AS', status: 'idle', currentOrderId: null, location: { lat: 13.08, lng: 80.26 }, capacity: { currentLoad: 0, maxLoad: 4 }, avgEtaMins: 15, rating: 4.9, zone: 'South' },
    { id: 'RIDER-0004', rider_id: 'RIDER-0004', name: 'Sneha P', avatarInitials: 'SP', status: 'online', currentOrderId: null, location: { lat: 13.07, lng: 80.27 }, capacity: { currentLoad: 0, maxLoad: 4 }, avgEtaMins: 10, rating: 4.7, zone: 'Central' },
    { id: 'RIDER-0005', rider_id: 'RIDER-0005', name: 'Vikram R', avatarInitials: 'VR', status: 'idle', currentOrderId: null, location: { lat: 13.09, lng: 80.29 }, capacity: { currentLoad: 0, maxLoad: 4 }, avgEtaMins: 14, rating: 4.5, zone: 'North' },
    { id: 'RIDER-0006', rider_id: 'RIDER-0006', name: 'Karthik N', avatarInitials: 'KN', status: 'online', currentOrderId: null, location: { lat: 13.10, lng: 80.30 }, capacity: { currentLoad: 0, maxLoad: 4 }, avgEtaMins: 11, rating: 4.8, zone: 'East' },
  ];
  
  for (const r of ridersData) {
    await Rider.findOneAndUpdate({ id: r.id }, r, { upsert: true, new: true });
  }
  console.log(`   ✅ ${ridersData.length} riders ready`);

  // Step 3: Create fresh orders with various statuses
  console.log('📦 Creating fresh orders...');
  
  const ordersData = [
    // Pending orders (no rider assigned)
    {
      id: 'ORD-0001',
      order_id: 'ORD-0001',
      status: 'pending',
      riderId: null,
      etaMinutes: null,
      slaDeadline: new Date(now.getTime() + 45 * 60 * 1000), // 45 mins from now
      pickupLocation: 'Warehouse Hub A, Chennai Central',
      dropLocation: '123 MG Road, T Nagar, Chennai',
      customerName: 'Ramesh Kumar',
      items: ['Laptop Bag', 'Wireless Mouse', 'USB Cable'],
      timeline: [
        { status: 'pending', time: new Date(now.getTime() - 10 * 60 * 1000), note: 'Order created' }
      ],
      zone: 'Central'
    },
    {
      id: 'ORD-0002',
      order_id: 'ORD-0002',
      status: 'pending',
      riderId: null,
      etaMinutes: null,
      slaDeadline: new Date(now.getTime() + 50 * 60 * 1000), // 50 mins from now
      pickupLocation: 'Distribution Center B, Chennai',
      dropLocation: '456 Anna Salai, Guindy, Chennai',
      customerName: 'Priya Sharma',
      items: ['Smartphone Case', 'Screen Protector'],
      timeline: [
        { status: 'pending', time: new Date(now.getTime() - 5 * 60 * 1000), note: 'Order created' }
      ],
      zone: 'South'
    },
    
    // Assigned orders (with rider)
    {
      id: 'ORD-0003',
      order_id: 'ORD-0003',
      status: 'assigned',
      riderId: 'RIDER-0001',
      etaMinutes: 15,
      slaDeadline: new Date(now.getTime() + 30 * 60 * 1000), // 30 mins from now
      pickupLocation: 'Hub C, Velachery, Chennai',
      dropLocation: '789 OMR Road, Sholinganallur, Chennai',
      customerName: 'Arjun Menon',
      items: ['Gaming Headset', 'Keyboard', 'Mouse Pad'],
      timeline: [
        { status: 'pending', time: new Date(now.getTime() - 20 * 60 * 1000), note: 'Order created' },
        { status: 'assigned', time: new Date(now.getTime() - 5 * 60 * 1000), note: 'Assigned to Raj Kumar' }
      ],
      zone: 'Central'
    },
    {
      id: 'ORD-0004',
      order_id: 'ORD-0004',
      status: 'assigned',
      riderId: 'RIDER-0002',
      etaMinutes: 12,
      slaDeadline: new Date(now.getTime() + 25 * 60 * 1000), // 25 mins from now
      pickupLocation: 'Warehouse D, Ambattur, Chennai',
      dropLocation: '321 Poonamallee High Road, Chennai',
      customerName: 'Deepa Nair',
      items: ['Bluetooth Speaker', 'Power Bank'],
      timeline: [
        { status: 'pending', time: new Date(now.getTime() - 15 * 60 * 1000), note: 'Order created' },
        { status: 'assigned', time: new Date(now.getTime() - 3 * 60 * 1000), note: 'Assigned to Priya M' }
      ],
      zone: 'North'
    },
    
    // In Transit orders
    {
      id: 'ORD-0005',
      order_id: 'ORD-0005',
      status: 'in_transit',
      riderId: 'RIDER-0003',
      etaMinutes: 8,
      slaDeadline: new Date(now.getTime() + 20 * 60 * 1000), // 20 mins from now
      pickupLocation: 'Hub E, Adyar, Chennai',
      dropLocation: '654 Besant Nagar, Chennai',
      customerName: 'Suresh Reddy',
      items: ['Fitness Tracker', 'Water Bottle'],
      timeline: [
        { status: 'pending', time: new Date(now.getTime() - 30 * 60 * 1000), note: 'Order created' },
        { status: 'assigned', time: new Date(now.getTime() - 20 * 60 * 1000), note: 'Assigned to Amit S' },
        { status: 'picked_up', time: new Date(now.getTime() - 10 * 60 * 1000), note: 'Picked up from hub' },
        { status: 'in_transit', time: new Date(now.getTime() - 5 * 60 * 1000), note: 'In transit to customer' }
      ],
      zone: 'South'
    },
    {
      id: 'ORD-0006',
      order_id: 'ORD-0006',
      status: 'in_transit',
      riderId: 'RIDER-0004',
      etaMinutes: 6,
      slaDeadline: new Date(now.getTime() + 15 * 60 * 1000), // 15 mins from now
      pickupLocation: 'Distribution Center F, Porur, Chennai',
      dropLocation: '987 Mount Road, Chennai',
      customerName: 'Lakshmi Iyer',
      items: ['Tablet Stand', 'Stylus Pen'],
      timeline: [
        { status: 'pending', time: new Date(now.getTime() - 25 * 60 * 1000), note: 'Order created' },
        { status: 'assigned', time: new Date(now.getTime() - 18 * 60 * 1000), note: 'Assigned to Sneha P' },
        { status: 'picked_up', time: new Date(now.getTime() - 8 * 60 * 1000), note: 'Picked up from hub' },
        { status: 'in_transit', time: new Date(now.getTime() - 2 * 60 * 1000), note: 'In transit to customer' }
      ],
      zone: 'Central'
    },
    
    // Picked Up orders
    {
      id: 'ORD-0007',
      order_id: 'ORD-0007',
      status: 'picked_up',
      riderId: 'RIDER-0005',
      etaMinutes: 10,
      slaDeadline: new Date(now.getTime() + 18 * 60 * 1000), // 18 mins from now
      pickupLocation: 'Hub G, Chromepet, Chennai',
      dropLocation: '147 GST Road, Tambaram, Chennai',
      customerName: 'Vijay Kumar',
      items: ['Laptop Charger', 'HDMI Cable'],
      timeline: [
        { status: 'pending', time: new Date(now.getTime() - 22 * 60 * 1000), note: 'Order created' },
        { status: 'assigned', time: new Date(now.getTime() - 12 * 60 * 1000), note: 'Assigned to Vikram R' },
        { status: 'picked_up', time: new Date(now.getTime() - 3 * 60 * 1000), note: 'Picked up from hub' }
      ],
      zone: 'South'
    },
    
    // Delayed order (for testing alerts)
    {
      id: 'ORD-0008',
      order_id: 'ORD-0008',
      status: 'delayed',
      riderId: 'RIDER-0001',
      etaMinutes: 25,
      slaDeadline: new Date(now.getTime() - 5 * 60 * 1000), // 5 mins ago (overdue)
      pickupLocation: 'Warehouse H, Perungudi, Chennai',
      dropLocation: '258 ECR Road, Neelankarai, Chennai',
      customerName: 'Meera Krishnan',
      items: ['Camera Bag', 'Memory Card'],
      timeline: [
        { status: 'pending', time: new Date(now.getTime() - 40 * 60 * 1000), note: 'Order created' },
        { status: 'assigned', time: new Date(now.getTime() - 35 * 60 * 1000), note: 'Assigned to Raj Kumar' },
        { status: 'picked_up', time: new Date(now.getTime() - 30 * 60 * 1000), note: 'Picked up from hub' },
        { status: 'in_transit', time: new Date(now.getTime() - 20 * 60 * 1000), note: 'In transit' },
        { status: 'delayed', time: new Date(now.getTime() - 10 * 60 * 1000), note: 'Delivery delayed due to traffic' }
      ],
      zone: 'Central'
    }
  ];

  // Insert orders
  for (const orderData of ordersData) {
    try {
      await Order.findOneAndUpdate(
        { id: orderData.id },
        orderData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (error) {
      console.error(`   ❌ Error creating order ${orderData.id}:`, error.message);
    }
  }

  console.log(`   ✅ Created ${ordersData.length} fresh orders`);
  
  // Update rider currentOrderId for assigned orders
  console.log('🔄 Updating rider assignments...');
  const assignedOrders = ordersData.filter(o => o.riderId && o.status !== 'delivered');
  for (const order of assignedOrders) {
    const rider = await Rider.findOne({ id: order.riderId });
    if (rider) {
      rider.currentOrderId = order.id;
      rider.capacity.currentLoad = (rider.capacity.currentLoad || 0) + 1;
      await rider.save();
    }
  }
  console.log(`   ✅ Updated ${assignedOrders.length} rider assignments`);

  // Summary
  console.log('\n📊 Summary:');
  console.log(`   • Total Orders: ${ordersData.length}`);
  console.log(`   • Pending: ${ordersData.filter(o => o.status === 'pending').length}`);
  console.log(`   • Assigned: ${ordersData.filter(o => o.status === 'assigned').length}`);
  console.log(`   • In Transit: ${ordersData.filter(o => o.status === 'in_transit').length}`);
  console.log(`   • Picked Up: ${ordersData.filter(o => o.status === 'picked_up').length}`);
  console.log(`   • Delayed: ${ordersData.filter(o => o.status === 'delayed').length}`);
  
  console.log('\n✅ Fresh orders data seeded successfully!');
  console.log('   View Details and Reassign Rider should work perfectly now.\n');

  await mongoose.connection.close();
  process.exit(0);
}

seedFreshOrders().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
