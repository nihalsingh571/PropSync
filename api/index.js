import dotenv from 'dotenv';
import connectDB from '../server/config/database.js';
import createApp from '../server/app.js';

dotenv.config();

// Cache the database connection across warm Vercel invocations
let isConnected = false;

// Create the Express app with open CORS (Vercel handles domain security)
const app = createApp({ allowedOrigins: [] });

export default async function handler(req, res) {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }

  return app(req, res);
}
