/**
 * Seed Rider Fleet dashboard data: Riders, Orders, RiderHR, Documents, Training, Vehicles, Maintenance, Approvals.
 * Run: node src/seed-rider.js (from backend root, with MONGO_URI set)
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');

const Rider = require('./rider/models/Rider');
const Order = require('./warehouse/models/Order');
const RiderHR = require('./rider/models/RiderHR');
const Document = require('./rider/models/Document');
const Training = require('./rider/models/Training');
const Vehicle = require('./rider/models/Vehicle');
const MaintenanceTask = require('./rider/models/MaintenanceTask');
const ApprovalRequest = require('./common-models/ApprovalRequest');
const Contract = require('./rider/models/Contract');
const Compliance = require('./rider/models/Compliance');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/selorg-admin-ops';

async function connect() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');
}

async function seed() {
  await connect();

  const now = new Date();
  const future = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 1. Riders
  const ridersData = [
    { id: 'RIDER-1', name: 'Raj Kumar', avatarInitials: 'RK', status: 'online', currentOrderId: 'ORD-1', location: { lat: 13.0827, lng: 80.2707 }, capacity: { currentLoad: 1, maxLoad: 4 }, avgEtaMins: 12, rating: 4.8, zone: 'Central' },
    { id: 'RIDER-2', name: 'Priya M', avatarInitials: 'PM', status: 'busy', currentOrderId: 'ORD-2', location: { lat: 13.09, lng: 80.28 }, capacity: { currentLoad: 2, maxLoad: 4 }, avgEtaMins: 8, rating: 4.6, zone: 'North' },
    { id: 'RIDER-3', name: 'Amit S', avatarInitials: 'AS', status: 'idle', currentOrderId: null, location: { lat: 13.08, lng: 80.26 }, capacity: { currentLoad: 0, maxLoad: 4 }, avgEtaMins: 15, rating: 4.9, zone: 'South' },
    { id: 'RIDER-4', name: 'Sneha P', avatarInitials: 'SP', status: 'online', currentOrderId: null, location: { lat: 13.07, lng: 80.27 }, capacity: { currentLoad: 1, maxLoad: 4 }, avgEtaMins: 10, rating: 4.7, zone: 'Central' },
    { id: 'RIDER-5', name: 'Vikram R', avatarInitials: 'VR', status: 'idle', currentOrderId: null, location: { lat: 13.09, lng: 80.29 }, capacity: { currentLoad: 0, maxLoad: 4 }, avgEtaMins: 14, rating: 4.5, zone: 'North' },
  ];
  for (const r of ridersData) {
    await Rider.findOneAndUpdate({ id: r.id }, r, { upsert: true, new: true });
  }
  console.log('Riders seeded:', ridersData.length);

  // 2. Orders (warehouse collection)
  const sla1 = new Date(now.getTime() + 25 * 60 * 1000);
  const sla2 = new Date(now.getTime() + 45 * 60 * 1000);
  const sla3 = new Date(now.getTime() + 60 * 60 * 1000);
  const ordersData = [
    { id: 'ORD-1', status: 'in_transit', riderId: 'RIDER-1', etaMinutes: 8, slaDeadline: sla1, pickupLocation: 'Hub A, Chennai', dropLocation: '123 Main St', customerName: 'John D', items: ['Pizza', 'Cola'], timeline: [{ status: 'assigned', time: past, note: 'Assigned' }, { status: 'in_transit', time: now, note: 'Picked up' }], zone: 'Central' },
    { id: 'ORD-2', status: 'assigned', riderId: 'RIDER-2', etaMinutes: 12, slaDeadline: sla2, pickupLocation: 'Hub B, Chennai', dropLocation: '456 Oak Ave', customerName: 'Jane S', items: ['Burger', 'Fries'], timeline: [{ status: 'assigned', time: now, note: 'Assigned' }], zone: 'North' },
    { id: 'ORD-3', status: 'pending', riderId: null, etaMinutes: null, slaDeadline: sla3, pickupLocation: 'Hub A, Chennai', dropLocation: '789 Elm Rd', customerName: 'Bob T', items: ['Salad'], timeline: [], zone: 'Central' },
    { id: 'ORD-4', status: 'delivered', riderId: 'RIDER-3', etaMinutes: null, slaDeadline: past, pickupLocation: 'Hub A', dropLocation: '321 Pine St', customerName: 'Alice W', items: ['Coffee'], timeline: [{ status: 'delivered', time: past, note: 'Delivered' }], completedAt: past, deliveryTimeSeconds: 1320, zone: 'South' },
  ];
  for (const o of ordersData) {
    await Order.findOneAndUpdate({ id: o.id }, o, { upsert: true, new: true });
  }
  console.log('Orders seeded:', ordersData.length);

  // 3. RiderHR (id must match RIDER-\d+, phone +[1-9]\d{1,14})
  const riderHrData = [
    { id: 'RIDER-1', name: 'Raj Kumar', phone: '+919876543210', email: 'raj.k@example.com', status: 'active', onboardingStatus: 'approved', trainingStatus: 'completed', appAccess: 'enabled', deviceAssigned: true, deviceId: 'DEV-1', deviceType: 'Android', contract: { startDate: past, endDate: future, renewalDue: false }, compliance: { isCompliant: true, lastAuditDate: past, policyViolationsCount: 0 } },
    { id: 'RIDER-2', name: 'Priya M', phone: '+919876543211', email: 'priya.m@example.com', status: 'active', onboardingStatus: 'approved', trainingStatus: 'completed', appAccess: 'enabled', deviceAssigned: true, deviceId: 'DEV-2', deviceType: 'iOS', contract: { startDate: past, endDate: future, renewalDue: false }, compliance: { isCompliant: true, lastAuditDate: past, policyViolationsCount: 0 } },
    { id: 'RIDER-3', name: 'Amit S', phone: '+919876543212', email: 'amit.s@example.com', status: 'active', onboardingStatus: 'under_review', trainingStatus: 'in_progress', appAccess: 'enabled', deviceAssigned: false, contract: { startDate: past, endDate: future, renewalDue: false }, compliance: { isCompliant: true, lastAuditDate: past, policyViolationsCount: 0 } },
    { id: 'RIDER-4', name: 'Sneha P', phone: '+919876543213', email: 'sneha.p@example.com', status: 'onboarding', onboardingStatus: 'docs_pending', trainingStatus: 'not_started', appAccess: 'disabled', deviceAssigned: false, contract: { startDate: past, endDate: future, renewalDue: false }, compliance: { isCompliant: false, lastAuditDate: past, policyViolationsCount: 0 } },
    { id: 'RIDER-5', name: 'Vikram R', phone: '+919876543214', email: 'vikram.r@example.com', status: 'active', onboardingStatus: 'approved', trainingStatus: 'completed', appAccess: 'enabled', deviceAssigned: true, deviceId: 'DEV-5', deviceType: 'Android', contract: { startDate: past, endDate: future, renewalDue: true }, compliance: { isCompliant: true, lastAuditDate: past, policyViolationsCount: 0 } },
  ];
  for (const r of riderHrData) {
    await RiderHR.findOneAndUpdate({ id: r.id }, r, { upsert: true, new: true });
  }
  console.log('RiderHR seeded:', riderHrData.length);

  // 4. Documents
  const docsData = [
    { id: 'DOC-1', riderId: 'RIDER-1', riderName: 'Raj Kumar', documentType: 'Driving License', submittedAt: past, status: 'approved', reviewer: 'Admin', reviewedAt: past, fileUrl: '/files/doc1.pdf', approvalHistory: [] },
    { id: 'DOC-2', riderId: 'RIDER-4', riderName: 'Sneha P', documentType: 'ID Proof', submittedAt: now, status: 'pending', fileUrl: '/files/doc2.pdf', approvalHistory: [] },
    { id: 'DOC-3', riderId: 'RIDER-3', riderName: 'Amit S', documentType: 'Vehicle RC', submittedAt: past, expiresAt: future, status: 'approved', reviewer: 'Admin', reviewedAt: past, fileUrl: '/files/doc3.pdf', approvalHistory: [] },
    { id: 'DOC-4', riderId: 'RIDER-4', riderName: 'Sneha P', documentType: 'Insurance Policy', submittedAt: past, expiresAt: past, status: 'expired', fileUrl: '/files/doc4.pdf', approvalHistory: [] },
  ];
  for (const d of docsData) {
    await Document.findOneAndUpdate({ id: d.id }, d, { upsert: true, new: true });
  }
  console.log('Documents seeded:', docsData.length);

  // 5. Training
  const trainingData = [
    { riderId: 'RIDER-1', riderName: 'Raj Kumar', status: 'completed', modules: [{ id: 'm1', name: 'Safety', completed: true, completedAt: past }, { id: 'm2', name: 'Navigation', completed: true, completedAt: past }], modulesCompleted: 2, totalModules: 2, progressPercentage: 100, completedAt: past },
    { riderId: 'RIDER-2', riderName: 'Priya M', status: 'completed', modules: [{ id: 'm1', name: 'Safety', completed: true }, { id: 'm2', name: 'Navigation', completed: true }], modulesCompleted: 2, totalModules: 2, progressPercentage: 100, completedAt: past },
    { riderId: 'RIDER-3', riderName: 'Amit S', status: 'in_progress', modules: [{ id: 'm1', name: 'Safety', completed: true, completedAt: past }, { id: 'm2', name: 'Navigation', completed: false, completedAt: null }], modulesCompleted: 1, totalModules: 2, progressPercentage: 50 },
    { riderId: 'RIDER-4', riderName: 'Sneha P', status: 'not_started', modules: [], modulesCompleted: 0, totalModules: 5, progressPercentage: 0 },
    { riderId: 'RIDER-5', riderName: 'Vikram R', status: 'completed', modules: [{ id: 'm1', name: 'Safety', completed: true }, { id: 'm2', name: 'Navigation', completed: true }], modulesCompleted: 2, totalModules: 2, progressPercentage: 100, completedAt: past },
  ];
  for (const t of trainingData) {
    await Training.findOneAndUpdate({ riderId: t.riderId }, t, { upsert: true, new: true });
  }
  console.log('Training seeded:', trainingData.length);

  // 6. Vehicles
  const vehicleDoc = { rcValidTill: future, insuranceValidTill: future, pucValidTill: future };
  const vehiclesData = [
    { id: 'VH-1', vehicleId: 'VH-1', type: 'Electric Scooter', fuelType: 'EV', assignedRiderId: 'RIDER-1', assignedRiderName: 'Raj Kumar', status: 'active', conditionScore: 95, conditionLabel: 'Excellent', lastServiceDate: past, nextServiceDueDate: future, currentOdometerKm: 1200, utilizationPercent: 60, documents: vehicleDoc, pool: 'Dedicated' },
    { id: 'VH-2', vehicleId: 'VH-2', type: 'Motorbike (Gas)', fuelType: 'Petrol', assignedRiderId: 'RIDER-2', assignedRiderName: 'Priya M', status: 'active', conditionScore: 88, conditionLabel: 'Excellent', lastServiceDate: past, nextServiceDueDate: future, currentOdometerKm: 3400, utilizationPercent: 70, documents: vehicleDoc, pool: 'Dedicated' },
    { id: 'VH-3', vehicleId: 'VH-3', type: 'Electric Scooter', fuelType: 'EV', status: 'maintenance', conditionScore: 65, conditionLabel: 'Good', lastServiceDate: past, nextServiceDueDate: now, currentOdometerKm: 800, utilizationPercent: 40, documents: vehicleDoc, pool: 'Hub' },
    { id: 'VH-4', vehicleId: 'VH-4', type: 'Bicycle', fuelType: 'Other', status: 'active', conditionScore: 90, conditionLabel: 'Excellent', lastServiceDate: past, nextServiceDueDate: future, currentOdometerKm: 200, utilizationPercent: 20, documents: vehicleDoc, pool: 'Spare' },
  ];
  for (const v of vehiclesData) {
    await Vehicle.findOneAndUpdate({ id: v.id }, v, { upsert: true, new: true });
  }
  console.log('Vehicles seeded:', vehiclesData.length);

  // 7. MaintenanceTask
  const maintData = [
    { id: 'MNT-1', vehicleId: 'VH-3', vehicleInternalId: 'VH-3', type: 'Scheduled Service', scheduledDate: now, status: 'upcoming', workshopName: 'City Workshop', notes: 'Annual service' },
    { id: 'MNT-2', vehicleId: 'VH-1', vehicleInternalId: 'VH-1', type: 'Inspection', scheduledDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), status: 'upcoming', workshopName: 'EV Service Center' },
    { id: 'MNT-3', vehicleId: 'VH-2', vehicleInternalId: 'VH-2', type: 'Scheduled Service', scheduledDate: past, status: 'completed', workshopName: 'City Workshop', notes: 'Done', cost: 1500 },
  ];
  for (const m of maintData) {
    await MaintenanceTask.findOneAndUpdate({ id: m.id }, m, { upsert: true, new: true });
  }
  console.log('MaintenanceTask seeded:', maintData.length);

  // 8. ApprovalRequest (common-models)
  const approvalsData = [
    { id: 'approval-1', type: 'order_exception', title: 'Order delay exception', description: 'Customer requested extension', requestedBy: 'Raj K', requestedById: 'RIDER-1', requesterRole: 'Rider', status: 'pending', metadata: {} },
    { id: 'approval-2', type: 'document_approval', title: 'Driving license verification', description: 'New rider document', requestedBy: 'Priya M', requestedById: 'RIDER-2', requesterRole: 'Rider', status: 'pending', metadata: {} },
    { id: 'approval-3', type: 'vehicle_request', title: 'Vehicle swap request', description: 'Rider requested different vehicle', requestedBy: 'Amit S', requestedById: 'RIDER-3', requesterRole: 'Rider', status: 'pending', metadata: {} },
  ];
  for (const a of approvalsData) {
    await ApprovalRequest.findOneAndUpdate({ id: a.id }, a, { upsert: true, new: true });
  }
  console.log('ApprovalRequest seeded:', approvalsData.length);

  // 9. Contract (rider module - per rider)
  const contractData = [
    { riderId: 'RIDER-1', riderName: 'Raj Kumar', startDate: past, endDate: future, renewalDue: false, status: 'active' },
    { riderId: 'RIDER-2', riderName: 'Priya M', startDate: past, endDate: future, renewalDue: false, status: 'active' },
    { riderId: 'RIDER-3', riderName: 'Amit S', startDate: past, endDate: future, renewalDue: false, status: 'active' },
    { riderId: 'RIDER-4', riderName: 'Sneha P', startDate: past, endDate: future, renewalDue: false, status: 'active' },
    { riderId: 'RIDER-5', riderName: 'Vikram R', startDate: past, endDate: future, renewalDue: true, status: 'active' },
  ];
  for (const c of contractData) {
    await Contract.findOneAndUpdate({ riderId: c.riderId }, c, { upsert: true, new: true });
  }
  console.log('Contract seeded:', contractData.length);

  // 10. Compliance (rider module)
  const complianceData = [
    { riderId: 'RIDER-1', riderName: 'Raj Kumar', isCompliant: true, lastAuditDate: past, policyViolationsCount: 0, suspension: { isSuspended: false } },
    { riderId: 'RIDER-2', riderName: 'Priya M', isCompliant: true, lastAuditDate: past, policyViolationsCount: 0, suspension: { isSuspended: false } },
    { riderId: 'RIDER-3', riderName: 'Amit S', isCompliant: true, lastAuditDate: past, policyViolationsCount: 0, suspension: { isSuspended: false } },
    { riderId: 'RIDER-4', riderName: 'Sneha P', isCompliant: false, lastAuditDate: past, policyViolationsCount: 1, suspension: { isSuspended: false } },
    { riderId: 'RIDER-5', riderName: 'Vikram R', isCompliant: true, lastAuditDate: past, policyViolationsCount: 0, suspension: { isSuspended: false } },
  ];
  for (const c of complianceData) {
    await Compliance.findOneAndUpdate({ riderId: c.riderId }, c, { upsert: true, new: true });
  }
  console.log('Compliance seeded:', complianceData.length);

  console.log('\nRider Fleet seed completed successfully.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
