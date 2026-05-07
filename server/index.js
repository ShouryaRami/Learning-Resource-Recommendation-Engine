// UMBC Learn — Learning Resource Recommendation Engine v1.0 Beta
// SENG 701 Capstone — Spring 2026
// Student: Shourya Rami (AD39491)

const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const passport = require('passport');
require('./config/passport');
const connectDB = require('./config/db');
// const { globalLimiter, authLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const recommendationsRouter = require('./routes/recommendations');
const savedRouter = require('./routes/saved');
const chatRouter = require('./routes/chat');
const adminRouter = require('./routes/admin');
const feedbackRouter = require('./routes/feedback');
const usersRouter = require('./routes/users');
const departmentRouter = require('./routes/departments');
const courseRouter = require('./routes/courses');
const enrollmentRouter = require('./routes/enrollments');
const taRouter = require('./routes/ta');
const tipsRouter = require('./routes/tips');
const materialsRouter = require('./routes/materials');
const resourcesRouter = require('./routes/resources');
const aiRouter = require('./routes/ai');
const submissionsRouter = require('./routes/submissions');
const Resource = require('./models/Resource');
require('./models/CourseTip');
require('./models/ProjectIdea');
require('./models/Submission');
require('./models/Notification');
const seedResources = require('./data/seedResources');

const createIndexes = async () => {
  try {
    const db = mongoose.connection.db
    await db.collection('enrollments').createIndex(
      { courseId: 1, userId: 1 }, { unique: true, background: true }
    )
    await db.collection('enrollments').createIndex(
      { courseId: 1, status: 1 }, { background: true }
    )
    await db.collection('coursematerials').createIndex(
      { courseId: 1, isActive: 1, isProcessed: 1 }, { background: true }
    )
    await db.collection('coursetips').createIndex(
      { courseId: 1, isActive: 1, isVisibleToStudents: 1 }, { background: true }
    )
    await db.collection('projects').createIndex(
      { studentId: 1, status: 1 }, { background: true }
    )
    await db.collection('savedresources').createIndex(
      { userId: 1, isActive: 1 }, { background: true }
    )
    await db.collection('chatsessions').createIndex(
      { courseId: 1, userId: 1 }, { background: true }
    )
    await db.collection('submissions').createIndex(
      { courseId: 1, status: 1 }, { background: true }
    )
    console.error('MongoDB indexes created')
  } catch (err) {
    if (err.code !== 85 && err.code !== 86) {
      console.error('Index creation error:', err.message)
    }
  }
}

const seedIfEmpty = async () => {
  const count = await Resource.countDocuments();
  if (count === 0) {
    await Resource.insertMany(seedResources);
    console.log('Seeded 31 resources successfully');
  }
};

const startServer = async () => {
  await connectDB();
  mongoose.connection.once('open', () => { createIndexes() })
  await seedIfEmpty();

  // Clean up any expired OTPs from previous sessions
  try {
    const OTP = require('./models/OTP')
    const deleted = await OTP.deleteMany({
      expiresAt: { $lt: new Date() }
    })
    if (deleted.deletedCount > 0) {
      console.log(
        `Cleaned up ${deleted.deletedCount} expired OTPs`
      )
    }
  } catch (otpErr) {
    console.error('OTP cleanup error:', otpErr.message)
  }

  const app = express();
  const PORT = process.env.PORT || 5000;

  // Security headers must be first — before cors, json, or any routes
  app.use(helmet());

  // Global rate limiter — 100 requests per 15 minutes per IP
  // app.use(globalLimiter);

  app.use(cors());
  app.options('*', cors());
  // Increased limit to handle base64-encoded file metadata in JSON bodies
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize passport (no sessions — JWT only)
  app.use(passport.initialize());

  // Auth routes get stricter rate limit: 5 requests per 15 minutes
  // app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/projects', projectsRouter);
  app.use('/api/auth', authRoutes);
  app.use('/api/recommendations', recommendationsRouter);
  app.use('/api/saved', savedRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/feedback', feedbackRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/departments', departmentRouter);
  app.use('/api/courses', courseRouter);
  app.use('/api/enrollments', enrollmentRouter);
  app.use('/api/ta', taRouter);
  app.use('/api/tips', tipsRouter);
  app.use('/api/materials', materialsRouter);
  app.use('/api/resources', resourcesRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/submissions', submissionsRouter);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'UMBC Learn API is running' });
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
