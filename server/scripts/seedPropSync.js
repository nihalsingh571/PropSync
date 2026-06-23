// server/scripts/seedPropSync.js
// Run: node server/scripts/seedPropSync.js
// Creates demo Admin, Property Owner, Tenant, and Maintenance Staff users,
// 2 demo Properties with units, 3 Amenities, sample Maintenance Requests,
// and a sample Booking.

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../models/userModel.js';
import Property from '../models/propertyModel.js';
import Tenant from '../models/tenantModel.js';
import Amenity from '../models/amenityModel.js';
import AmenityBooking from '../models/amenityBookingModel.js';
import MaintenanceRequest from '../models/maintenanceRequestModel.js';
import Notification from '../models/notificationModel.js';

// ── Helpers ────────────────────────────────────────────────────────────────────
const log = (msg) => console.log(`  ✅ ${msg}`);
const warn = (msg) => console.warn(`  ⚠️  ${msg}`);

// ── Seed Data ──────────────────────────────────────────────────────────────────
// NOTE: Do NOT pre-hash passwords here.
// The userModel.pre('save') hook handles hashing automatically.
// Pre-hashing and then saving causes DOUBLE hashing, breaking login.
const defaultPassword = 'Password@123';

const seedUsers = async () => {
  await User.deleteMany({});
  log('Cleared users collection');

  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@propsync.dev',
    password: defaultPassword,
    phone: '+91-9000000001',
    roles: ['admin'],
    isAdmin: true
  });

  const owner = await User.create({
    name: 'Rajesh Sharma',
    email: 'owner@propsync.dev',
    password: defaultPassword,
    phone: '+91-9000000002',
    roles: ['property_owner']
  });

  const tenant1 = await User.create({
    name: 'Priya Mehta',
    email: 'tenant1@propsync.dev',
    password: defaultPassword,
    phone: '+91-9000000003',
    roles: ['tenant']
  });

  const tenant2 = await User.create({
    name: 'Amit Patel',
    email: 'tenant2@propsync.dev',
    password: defaultPassword,
    phone: '+91-9000000004',
    roles: ['tenant']
  });

  const staff = await User.create({
    name: 'Rahul Kumar',
    email: 'staff@propsync.dev',
    password: defaultPassword,
    phone: '+91-9000000005',
    roles: ['maintenance_staff']
  });

  log(`Created 5 users (admin, owner, 2 tenants, 1 staff)`);
  return { admin, owner, tenant1, tenant2, staff };
};

const seedProperties = async (owner) => {
  await Property.deleteMany({});
  log('Cleared properties collection');

  const prop1 = await Property.create({
    name: 'Sunrise Apartments',
    description: 'Modern 3-storey residential complex in the heart of Bengaluru.',
    ownerId: owner._id,
    address: {
      street: '42 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      zip: '560001',
      country: 'India'
    },
    type: 'apartment',
    totalUnits: 3,
    yearBuilt: 2019,
    units: [
      { unitNumber: 'A101', floor: 1, bedrooms: 2, bathrooms: 2, area: 950, monthlyRent: 28000, depositAmount: 56000, status: 'occupied' },
      { unitNumber: 'A102', floor: 1, bedrooms: 1, bathrooms: 1, area: 650, monthlyRent: 18000, depositAmount: 36000, status: 'occupied' },
      { unitNumber: 'A201', floor: 2, bedrooms: 3, bathrooms: 2, area: 1350, monthlyRent: 42000, depositAmount: 84000, status: 'vacant' }
    ],
    status: 'active'
  });

  const prop2 = await Property.create({
    name: 'Green Valley Residency',
    description: 'Peaceful residential society with lush greenery, near Electronic City.',
    ownerId: owner._id,
    address: {
      street: '15 Electronic City Phase 1',
      city: 'Bengaluru',
      state: 'Karnataka',
      zip: '560100',
      country: 'India'
    },
    type: 'apartment',
    totalUnits: 2,
    yearBuilt: 2022,
    units: [
      { unitNumber: 'B101', floor: 1, bedrooms: 2, bathrooms: 2, area: 1100, monthlyRent: 32000, depositAmount: 64000, status: 'vacant' },
      { unitNumber: 'B102', floor: 1, bedrooms: 2, bathrooms: 1, area: 900, monthlyRent: 24000, depositAmount: 48000, status: 'vacant' }
    ],
    status: 'active'
  });

  log(`Created 2 properties (Sunrise Apartments, Green Valley Residency)`);
  return { prop1, prop2 };
};

const seedTenants = async (tenant1, tenant2, prop1) => {
  await Tenant.deleteMany({});
  log('Cleared tenants collection');

  const leaseStart = new Date('2025-01-01');
  const leaseEnd = new Date('2026-12-31');

  const t1 = await Tenant.create({
    userId: tenant1._id,
    propertyId: prop1._id,
    unitNumber: 'A101',
    leaseStart,
    leaseEnd,
    monthlyRent: 28000,
    depositPaid: 56000,
    status: 'active',
    emergencyContact: { name: 'Suresh Mehta', phone: '+91-9100000001', relation: 'Spouse' }
  });

  const t2 = await Tenant.create({
    userId: tenant2._id,
    propertyId: prop1._id,
    unitNumber: 'A102',
    leaseStart: new Date('2025-03-01'),
    leaseEnd: new Date('2026-02-28'),
    monthlyRent: 18000,
    depositPaid: 36000,
    status: 'active',
    emergencyContact: { name: 'Neha Patel', phone: '+91-9100000002', relation: 'Sister' }
  });

  log(`Created 2 tenant records`);
  return { t1, t2 };
};

const seedAmenities = async (prop1) => {
  await Amenity.deleteMany({});
  log('Cleared amenities collection');

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const weekdayHours = days.map(day => ({
    day,
    open: '06:00',
    close: '22:00',
    isClosed: false
  }));

  const gym = await Amenity.create({
    name: 'Fitness Center',
    description: 'Fully equipped gym with cardio and weight training equipment.',
    type: 'gym',
    propertyId: prop1._id,
    capacity: 10,
    bookingDurationMin: 30,
    bookingDurationMax: 90,
    advanceBookingDays: 3,
    requiresApproval: false,
    operatingHours: weekdayHours,
    rules: ['Clean equipment after use', 'Wear proper sports attire', 'No food inside'],
    status: 'active'
  });

  const pool = await Amenity.create({
    name: 'Swimming Pool',
    description: 'Olympic-sized swimming pool, open year round.',
    type: 'swimming_pool',
    propertyId: prop1._id,
    capacity: 15,
    bookingDurationMin: 60,
    bookingDurationMax: 120,
    advanceBookingDays: 7,
    requiresApproval: false,
    operatingHours: weekdayHours.map(h => ({ ...h, open: '07:00', close: '20:00' })),
    rules: ['Shower before entering pool', 'Children must be supervised', 'No diving in shallow end'],
    status: 'active'
  });

  const meetingRoom = await Amenity.create({
    name: 'Community Meeting Room',
    description: 'Air-conditioned meeting room with projector and seating for 12.',
    type: 'meeting_room',
    propertyId: prop1._id,
    capacity: 12,
    bookingDurationMin: 60,
    bookingDurationMax: 240,
    advanceBookingDays: 7,
    requiresApproval: true,
    operatingHours: weekdayHours.map(h => ({
      ...h,
      open: '09:00',
      close: '18:00',
      isClosed: ['saturday', 'sunday'].includes(h.day)
    })),
    rules: ['Maximum 12 persons', 'Clean up after use', 'Book at least 24 hours in advance'],
    status: 'active'
  });

  log(`Created 3 amenities (Gym, Pool, Meeting Room)`);
  return { gym, pool, meetingRoom };
};

const seedMaintenanceRequests = async (tenant1, tenant2, prop1, staff, admin) => {
  await MaintenanceRequest.deleteMany({});
  log('Cleared maintenance requests collection');

  const req1 = await MaintenanceRequest.create({
    tenantId: tenant1._id,
    propertyId: prop1._id,
    unitNumber: 'A101',
    title: 'Kitchen tap leaking',
    description: 'The kitchen tap has been leaking continuously for 2 days. Water dripping from the base joint.',
    category: 'plumbing',
    priority: 'high',
    status: 'assigned',
    assignedTo: staff._id,
    assignedAt: new Date(),
    timeline: [
      { status: 'open', note: 'Request submitted by tenant', changedBy: tenant1._id, changedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { status: 'assigned', note: 'Assigned to Rahul Kumar for same-day fix', changedBy: admin._id, changedAt: new Date() }
    ]
  });

  const req2 = await MaintenanceRequest.create({
    tenantId: tenant2._id,
    propertyId: prop1._id,
    unitNumber: 'A102',
    title: 'AC not cooling properly',
    description: 'The split AC in the bedroom is running but not cooling. Room temperature remains high even after 2 hours.',
    category: 'hvac',
    priority: 'medium',
    status: 'open',
    timeline: [
      { status: 'open', note: 'Request submitted by tenant', changedBy: tenant2._id, changedAt: new Date() }
    ]
  });

  const req3 = await MaintenanceRequest.create({
    tenantId: tenant1._id,
    propertyId: prop1._id,
    unitNumber: 'A101',
    title: 'Living room light fixture flickering',
    description: 'The ceiling light in the living room flickers intermittently. Possible electrical issue.',
    category: 'electrical',
    priority: 'low',
    status: 'resolved',
    assignedTo: staff._id,
    resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    resolutionNote: 'Replaced the faulty light switch and bulb. Tested — working fine now.',
    timeline: [
      { status: 'open', note: 'Submitted by tenant', changedBy: tenant1._id, changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { status: 'assigned', note: 'Assigned to maintenance staff', changedBy: admin._id, changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { status: 'in_progress', note: 'Staff on site', changedBy: staff._id, changedAt: new Date(Date.now() - 25 * 60 * 60 * 1000) },
      { status: 'resolved', note: 'Issue fixed. Switch and bulb replaced.', changedBy: staff._id, changedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    ]
  });

  log(`Created 3 maintenance requests (1 assigned, 1 open, 1 resolved)`);
  return { req1, req2, req3 };
};

const seedBookings = async (tenant1, gym, prop1) => {
  await AmenityBooking.deleteMany({});
  log('Cleared bookings collection');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(9, 0, 0, 0);

  const booking = await AmenityBooking.create({
    amenityId: gym._id,
    tenantId: tenant1._id,
    propertyId: prop1._id,
    startTime: tomorrow,
    endTime: tomorrowEnd,
    status: 'confirmed',
    notes: 'Morning cardio session'
  });

  log(`Created 1 sample booking (Gym, tomorrow 08:00-09:00)`);
  return { booking };
};

const seedNotifications = async (tenant1, tenant2, staff) => {
  await Notification.deleteMany({});
  log('Cleared notifications collection');

  await Notification.insertMany([
    {
      recipientId: tenant1._id,
      type: 'maintenance_assigned',
      title: 'Your maintenance request has been assigned',
      body: 'Your plumbing request (kitchen tap leak) has been assigned to Rahul Kumar.',
      linkedEntityType: 'maintenance_request',
      read: false
    },
    {
      recipientId: staff._id,
      type: 'maintenance_assigned',
      title: 'New maintenance job assigned to you',
      body: 'You have been assigned to fix a plumbing issue at A101, Sunrise Apartments.',
      linkedEntityType: 'maintenance_request',
      read: false
    },
    {
      recipientId: tenant1._id,
      type: 'booking_confirmed',
      title: 'Gym booking confirmed',
      body: 'Your Fitness Center booking for tomorrow 08:00-09:00 is confirmed.',
      linkedEntityType: 'booking',
      read: false
    },
    {
      recipientId: tenant1._id,
      type: 'welcome',
      title: 'Welcome to PropSync!',
      body: 'Your account is active. You can now submit maintenance requests and book amenities.',
      read: true,
      readAt: new Date()
    },
    {
      recipientId: tenant2._id,
      type: 'welcome',
      title: 'Welcome to PropSync!',
      body: 'Your account is active. You can now submit maintenance requests and book amenities.',
      read: false
    }
  ]);

  log(`Created 5 sample notifications`);
};

// ── Main Runner ────────────────────────────────────────────────────────────────
const seed = async () => {
  console.log('\n🌱 PropSync Seed Script Starting...\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    const { admin, owner, tenant1, tenant2, staff } = await seedUsers();
    const { prop1, prop2 } = await seedProperties(owner);
    await seedTenants(tenant1, tenant2, prop1);
    const { gym, pool, meetingRoom } = await seedAmenities(prop1);
    await seedMaintenanceRequests(tenant1, tenant2, prop1, staff, admin);
    await seedBookings(tenant1, gym, prop1);
    await seedNotifications(tenant1, tenant2, staff);

    console.log('\n🎉 PropSync seed complete!\n');
    console.log('─────────────────────────────────────────────');
    console.log('  Login credentials (all use: Password@123)');
    console.log('─────────────────────────────────────────────');
    console.log('  Admin:    admin@propsync.dev');
    console.log('  Owner:    owner@propsync.dev');
    console.log('  Tenant 1: tenant1@propsync.dev');
    console.log('  Tenant 2: tenant2@propsync.dev');
    console.log('  Staff:    staff@propsync.dev');
    console.log('─────────────────────────────────────────────\n');

  } catch (err) {
    console.error('\n❌ Seed error:', err.message);
    if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
    process.exit(0);
  }
};

seed();
