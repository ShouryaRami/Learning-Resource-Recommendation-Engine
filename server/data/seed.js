const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Resource = require('../models/Resource');
const seedResources = require('./seedResources');

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    const count = await Resource.countDocuments();
    if (count === 0) {
      await Resource.insertMany(seedResources);
      console.log('Seeded 31 resources successfully');
    } else {
      console.log('Database already seeded, skipping');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

runSeed();
