import app from '../server/server.js';
import connectDB from '../server/config/database.js';

// Cache the database connection
let isConnected = false;

export default async function handler(req, res) {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }

    return app(req, res);
}
