import app from '../server/server.js';
import connectDB from '../server/config/database.js';

// Cache the database connection
let isConnected = false;

// Disable Vercel's default body parser so Express can process the raw stream
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }

    return app(req, res);
}
