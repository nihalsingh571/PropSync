import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import createApp from '../app.js';
import User from '../models/userModel.js';
import Neighborhood from '../models/neighborhoodModel.js';
import AdminActivityLog from '../models/adminActivityLogModel.js';

describe('Admin routes', () => {
  let mongoServer;
  let app;
  let adminToken;
  let userToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    app = createApp({ allowedOrigins: [] });
    await seedData();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  const seedData = async () => {
    const admin = await User.create({
      name: 'Admin Tester',
      email: 'admin@example.com',
      password: 'password123',
      roles: ['admin'],
      isAdmin: true
    });

    const user = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'password123',
      roles: ['user'],
      isAdmin: false
    });

    adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
    userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    await Neighborhood.create({
      name: 'Connaught Place',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      metrics: {
        safety: 8,
        affordability: 6,
        cleanliness: 7,
        walkability: 9,
        nightlife: 8,
        transport: 9
      },
      demographics: {},
      amenities: {},
      coordinates: {},
      housing: {},
      nearbyTransportHubs: [],
      reviews: [],
      overallRating: 4.3,
      viewCount: 15,
      matchSuccessRate: 80,
      sentimentScore: 0.6
    });

    await AdminActivityLog.create({
      adminId: admin._id,
      action: 'seed',
      entityType: 'system',
      entityId: admin._id.toString(),
      metadata: {}
    });
  };

  it('rejects non-admin access to dashboard stats', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard-stats')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('returns dashboard stats for admins', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard-stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totals');
    expect(res.body.totals).toHaveProperty('users');
  });

  it('returns activity log entries', async () => {
    const res = await request(app)
      .get('/api/admin/activity-log')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
