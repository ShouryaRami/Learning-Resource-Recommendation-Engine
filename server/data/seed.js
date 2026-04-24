const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Resource = require('../models/Resource');
const User = require('../models/User');
const seedResources = require('./seedResources');

/**
 * @desc Seed test user accounts for local development and demo.
 *   Checks by email before creating so this script is safe to re-run.
 *   Passwords are hashed with bcrypt rounds 12 to match production auth.
 */
const seedTestAccounts = async () => {
  const testUsers = [
    {
      fullName:         'Admin User',
      email:            'admin@umbc.edu',
      password:         'Admin123',
      role:             'admin',
      skillLevel:       'advanced',
      isVerified:       true,
    },
    {
      fullName:         'Dr. Smith',
      email:            'instructor@umbc.edu',
      password:         'Instructor123',
      role:             'instructor',
      skillLevel:       'advanced',
      isDepartmentHead: true,
      isVerified:       true,
    },
    {
      fullName:         'TA Johnson',
      email:            'ta@umbc.edu',
      password:         'TA123',
      role:             'ta',
      skillLevel:       'intermediate',
      isVerified:       true,
    },
    {
      fullName:         'Test Student',
      email:            'student@umbc.edu',
      password:         'Student123',
      role:             'student',
      skillLevel:       'beginner',
      isVerified:       true,
    },
  ];

  for (const userData of testUsers) {
    const exists = await User.findOne({ email: userData.email });
    if (!exists) {
      // Hash the user's password before saving
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      userData.password = hashedPassword;

      await User.create(userData);
      console.log(`Created test user: ${userData.email} (${userData.role})`);
    } else {
      console.log(`Test user already exists: ${userData.email} — skipping`);
    }
  }
};

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // Seed resource library
    const count = await Resource.countDocuments();
    if (count === 0) {
      await Resource.insertMany(seedResources);
      console.log('Seeded 31 resources successfully');
    } else {
      console.log('Resources already seeded, skipping');
    }

    // Seed test accounts
    await seedTestAccounts();
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

runSeed();
