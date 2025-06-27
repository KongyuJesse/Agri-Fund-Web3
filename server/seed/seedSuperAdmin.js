// server/seed/seedSuperAdmin.js

const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const SuperAdmin = require('../models/SuperAdmin');

// Load environment variables from server/config/.env
require('dotenv').config({
  path: path.join(__dirname, '..', 'config', '.env')
});

async function seedSuperAdmin() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in server/config/.env');
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected for seeding SuperAdmin.');

    // If any SuperAdmin already exists, exit
    const existing = await User.findOne({ role: 'SuperAdmin' });
    if (existing) {
      console.log('SuperAdmin already exists. Exiting seed.');
      process.exit(0);
    }

    // Create the User entry
    const superAdminUser = new User({
      email: 'kongyujesse@gmail.com',
      password: 'SuperAdminPass123!', // change if desired
      role: 'SuperAdmin',
      approved: true,
      sex: 'Other'
    });
    await superAdminUser.save();

    // Create SuperAdmin profile
    const superAdminProfile = new SuperAdmin({
      user: superAdminUser._id,
      name: 'Kongyu Jesse',
      country: 'Cameroon',
      dob: new Date('1980-01-15'),
      sex: 'Male'
    });
    await superAdminProfile.save();

    console.log('SuperAdmin seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding SuperAdmin:', err.message);
    process.exit(1);
  }
}

seedSuperAdmin();
