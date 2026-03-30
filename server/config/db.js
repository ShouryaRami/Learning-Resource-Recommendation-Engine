const mongoose = require('mongoose');

/**
 * @desc Connect to MongoDB Atlas using MONGODB_URI
 *   from environment variables. Exits process with
 *   code 1 if connection fails.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
