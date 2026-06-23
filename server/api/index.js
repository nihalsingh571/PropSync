import app from '../server.js';
import connectDB from '../config/database.js';

// Cache the database connection
let isConnected = false;

export default async function handler(req, res) {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }

    return app(req, res);
}
