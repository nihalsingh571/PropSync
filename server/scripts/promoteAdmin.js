import mongoose from 'mongoose';
import User from '../models/userModel.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neighborfit';

async function promoteAdmin(email) {
  await mongoose.connect(MONGODB_URI);
  const user = await User.findOneAndUpdate(
    { email },
    { isAdmin: true },
    { new: true }
  );
  if (user) {
    console.log(`User ${user.email} is now an admin.`);
  } else {
    console.log('User not found.');
  }
  await mongoose.disconnect();
}

// Replace with the email of the user you want to promote
const email = process.argv[2];
if (!email) {
  console.error('Usage: node promoteAdmin.js <user-email>');
  process.exit(1);
}
promoteAdmin(email); 