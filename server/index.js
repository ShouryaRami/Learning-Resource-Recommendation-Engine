// UMBC Learn — Learning Resource Recommendation Engine v1.0 Beta
// SENG 701 Capstone — Spring 2026
// Student: Shourya Rami (AD39491)

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('./config/passport');
const connectDB = require('./config/db');
const { globalLimiter, authLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const recommendationsRouter = require('./routes/recommendations');
const savedRouter = require('./routes/saved');
const chatRouter = require('./routes/chat');
const adminRouter = require('./routes/admin');
const feedbackRouter = require('./routes/feedback');
const usersRouter = require('./routes/users');
const Resource = require('./models/Resource');
const seedResources = require('./data/seedResources');

dotenv.config();

const seedIfEmpty = async () => {
  const count = await Resource.countDocuments();
  if (count === 0) {
    await Resource.insertMany(seedResources);
    console.log('Seeded 31 resources successfully');
  }
};

const startServer = async () => {
  await connectDB();
  await seedIfEmpty();

  const app = express();
  const PORT = process.env.PORT || 5000;

  // Security headers must be first — before cors, json, or any routes
  app.use(helmet());

  // Global rate limiter — 100 requests per 15 minutes per IP
  app.use(globalLimiter);

  app.use(cors());
  app.options('*', cors());
  app.use(express.json());

  // Initialize passport (no sessions — JWT only)
  app.use(passport.initialize());

  // Auth routes get stricter rate limit: 5 requests per 15 minutes
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/projects', projectsRouter);
  app.use('/api/recommendations', recommendationsRouter);
  app.use('/api/saved', savedRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/feedback', feedbackRouter);
  app.use('/api/users', usersRouter);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'UMBC Learn API is running' });
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
