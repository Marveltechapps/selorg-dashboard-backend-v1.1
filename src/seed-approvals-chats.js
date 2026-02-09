/**
 * Seed only Task Approvals and Communication Chats (lightweight).
 * Run: node src/seed-approvals-chats.js (from backend root; set MONGO_URI in .env).
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const ApprovalRequest = require('./common-models/ApprovalRequest');
const Chat = require('./common-models/Chat');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/selorg-admin-ops';

async function seed() {
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

  const now = new Date();
  const past = new Date(now.getTime() - 60 * 60 * 1000);

  // Delete existing approvals to start fresh
  console.log('🗑️  Deleting existing approvals...');
  const deleteResult = await ApprovalRequest.deleteMany({});
  console.log(`   Deleted ${deleteResult.deletedCount} existing approvals`);

  const approvalsData = [
    { id: 'approval-1', type: 'order_exception', title: 'Order delay exception', description: 'Customer requested extension', requestedBy: 'Raj K', requestedById: 'RIDER-0001', requesterRole: 'Rider', status: 'pending', metadata: {}, createdAt: past, updatedAt: past },
    { id: 'approval-2', type: 'document_approval', title: 'Driving license verification', description: 'New rider document', requestedBy: 'Priya M', requestedById: 'RIDER-0002', requesterRole: 'Rider', status: 'pending', metadata: {}, createdAt: past, updatedAt: past },
    { id: 'approval-3', type: 'vehicle_request', title: 'Vehicle swap request', description: 'Rider requested different vehicle', requestedBy: 'Amit S', requestedById: 'RIDER-0003', requesterRole: 'Rider', status: 'pending', metadata: {}, createdAt: now, updatedAt: now },
    { id: 'approval-4', type: 'other', title: 'Approve cheque', description: 'Expense cheque for fuel reimbursement', requestedBy: 'Vikram R', requestedById: 'RIDER-0005', requesterRole: 'Rider', status: 'pending', metadata: {}, createdAt: now, updatedAt: now },
    { id: 'approval-5', type: 'other', title: 'Approve cheque', description: 'Maintenance advance', requestedBy: 'Sneha P', requestedById: 'RIDER-0004', requesterRole: 'Rider', status: 'pending', metadata: {}, createdAt: now, updatedAt: now },
    { id: 'approval-6', type: 'order_exception', title: 'Route deviation request', description: 'Customer changed delivery address', requestedBy: 'Kiran T', requestedById: 'RIDER-0006', requesterRole: 'Rider', status: 'pending', metadata: {}, createdAt: now, updatedAt: now },
    { id: 'approval-7', type: 'other', title: 'Approve cheque', description: 'Monthly bonus payment', requestedBy: 'Raj Kumar', requestedById: 'RIDER-0001', requesterRole: 'Rider', status: 'pending', metadata: {}, createdAt: now, updatedAt: now },
    { id: 'approval-8', type: 'document_approval', title: 'Insurance document verification', description: 'Vehicle insurance renewal document', requestedBy: 'Anjali D', requestedById: 'RIDER-0007', requesterRole: 'Rider', status: 'pending', metadata: {}, createdAt: now, updatedAt: now },
    { id: 'approval-9', type: 'order_exception', title: 'Delivery time extension', description: 'Customer requested 2 hour extension', requestedBy: 'Rohit M', requestedById: 'RIDER-0008', requesterRole: 'Rider', status: 'pending', metadata: {}, createdAt: now, updatedAt: now },
    { id: 'approval-10', type: 'vehicle_request', title: 'Vehicle maintenance request', description: 'Request for vehicle service appointment', requestedBy: 'Neha S', requestedById: 'RIDER-0009', requesterRole: 'Rider', status: 'pending', metadata: {}, createdAt: now, updatedAt: now },
  ];
  for (const a of approvalsData) {
    await ApprovalRequest.findOneAndUpdate(
      { id: a.id }, 
      { $set: a }, 
      { upsert: true, new: true, runValidators: false }
    );
  }
  console.log(`✅ ApprovalRequest seeded: ${approvalsData.length} approvals`);

  const lastMsg = new Date(now.getTime() - 5 * 60 * 1000);
  const chatsData = [
    { id: 'chat-1', participantId: 'RIDER-1', participantName: 'Raj Kumar', participantType: 'Rider', isOnline: true, relatedOrderId: null, lastMessage: 'Hi, need support', lastMessageTime: lastMsg, unreadCount: 0 },
    { id: 'chat-2', participantId: 'RIDER-2', participantName: 'Priya M', participantType: 'Rider', isOnline: false, relatedOrderId: null, lastMessage: 'Order delivered', lastMessageTime: lastMsg, unreadCount: 0 },
  ];
  for (const c of chatsData) {
    await Chat.findOneAndUpdate({ id: c.id }, c, { upsert: true, new: true });
  }
  console.log('Chats seeded:', chatsData.length);

  console.log('Task Approvals and Chats seed done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
