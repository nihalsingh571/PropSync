import dotenv from 'dotenv';
import connectDB from '../server/config/database.js';
import createApp from '../server/app.js';

dotenv.config();

// Cache the database connection across warm Vercel invocations
let isConnected = false;

// Create the Express app once at module load (open CORS — Vercel handles domain security)
const app = createApp({ allowedOrigins: [] });

export default async function handler(req, res) {
  // Ensure DB is connected before handling any request
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (err) {
      console.error('[Vercel] MongoDB connection failed:', err.message);
      return res.status(503).json({
        message: 'Database connection failed. Please check MongoDB Atlas Network Access whitelist.',
        error: err.message,
      });
    }
  }

  return app(req, res);
}
