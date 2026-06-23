#!/usr/bin/env node
/**
 * Connects to the server's Socket.IO /admin namespace and logs all events.
 * Run the server first (npm run dev), then run: node scripts/listenAdminEvents.js
 * Use another terminal to trigger: POST /api/auth/register, POST /api/neighborhoods (admin), POST /api/admin/users/bulk-actions
 */
import { io } from 'socket.io-client';

const BASE = process.env.API_URL || 'http://localhost:8000';
const adminNs = io(`${BASE}/admin`, { transports: ['websocket', 'polling'] });

adminNs.on('connect', () => {
  console.log('Connected to /admin namespace');
});

adminNs.on('connected', (data) => {
  console.log('Server confirmed:', data);
});

const events = ['new_user_registered', 'neighborhood_updated', 'admin_action_performed', 'system_alert', 'live_user_count'];
events.forEach((ev) => {
  adminNs.on(ev, (payload) => {
    console.log(`\n[${new Date().toISOString()}] Event: ${ev}`);
    console.log(JSON.stringify(payload, null, 2));
  });
});

adminNs.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

adminNs.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
});

console.log(`Listening for admin events at ${BASE}/admin. Trigger API requests to see events.\n');
