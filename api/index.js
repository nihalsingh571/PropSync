import dotenv from 'dotenv';
import connectDB from '../server/config/database.js';
import createApp from '../server/app.js';

dotenv.config();

// Cache the database connection across warm Vercel invocations
let isConnected = false;

// Create the Express app once at module load (open CORS — Vercel handles domain security)
const app = createApp({ allowedOrigins: [] });

export default async function handler(req, res) {
  try {
    // Ensure DB is connected before handling any request
    if (!isConnected) {
      await connectDB();
      isConnected = true;
    }
    return app(req, res);
  } catch (err) {
    console.error('[Vercel Handler Error]:', err);
    return res.status(500).json({
      message: 'Vercel Serverless Function encountered an error.',
      error: err.message,
      stack: err.stack,
    });
  }
}
