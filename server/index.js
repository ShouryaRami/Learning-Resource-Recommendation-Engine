const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
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

  app.use(cors({
    origin: [
      'http://localhost:5173',
      'https://umbc-learn.vercel.app'
    ],
    credentials: true
  }));
  app.use(express.json());

  app.use('/api/auth', authRoutes);
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
