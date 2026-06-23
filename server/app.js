import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// ─── PropSync Route Imports (added progressively per phase) ─────────────────
// Phase 4:  import propertyRoutes from './routes/propertyRoutes.js';
// Phase 5:  import tenantRoutes from './routes/tenantRoutes.js';
// Phase 6:  import maintenanceRoutes from './routes/maintenanceRoutes.js';
// Phase 7:  import amenityRoutes from './routes/amenityRoutes.js';
// Phase 8:  import bookingRoutes from './routes/bookingRoutes.js';
// Phase 9:  import notificationRoutes from './routes/notificationRoutes.js';

const buildCorsOptions = (allowedOrigins = []) => ({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

export const createApp = ({ allowedOrigins = [] } = {}) => {
  const app = express();

  const corsOptions = buildCorsOptions(allowedOrigins);
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ─── Core Routes ───────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);

  // ─── PropSync Domain Routes (uncommented progressively per phase) ──────────
  // app.use('/api/properties', propertyRoutes);     // Phase 4
  // app.use('/api/tenants', tenantRoutes);           // Phase 5
  // app.use('/api/maintenance', maintenanceRoutes);  // Phase 6
  // app.use('/api/amenities', amenityRoutes);        // Phase 7
  // app.use('/api/bookings', bookingRoutes);         // Phase 8
  // app.use('/api/notifications', notificationRoutes); // Phase 9

  app.get('/', (req, res) => {
    res.json({
      message: 'PropSync API running ✅',
      version: '2.0.0',
      platform: 'Real-Time Property Rental, Maintenance & Amenity Management',
      endpoints: {
        auth: '/api/auth',
        admin: '/api/admin',
        properties: '/api/properties',
        tenants: '/api/tenants',
        maintenance: '/api/maintenance',
        amenities: '/api/amenities',
        bookings: '/api/bookings',
        notifications: '/api/notifications'
      }
    });
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      message: 'Something went wrong!',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  });

  app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  return app;
};

export default createApp;
