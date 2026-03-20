/**
 * Projects routes
 * POST   /api/projects              — create a new project
 * GET    /api/projects/user/:userId — get all projects for a user
 * GET    /api/projects/:projectId   — get a single project by ID
 */
const express = require('express');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/projects
router.post('/', protect, async (req, res) => {
  try {
    const { title, domain, language, skillLevel, timeline, description } = req.body;

    if (!title || !domain || !language || !skillLevel) {
      return res.status(400).json({
        message: 'title, domain, language and skillLevel are required',
      });
    }

    const project = await Project.create({
      userId: req.user.id,
      title,
      domain,
      language,
      skillLevel,
      timeline,
      description,
    });

    return res.status(201).json(project);
  } catch (err) {
    return res.status(500).json({ message: 'Server error creating project' });
  }
});

// GET /api/projects/user/:userId
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    return res.status(200).json(projects);
  } catch (err) {
    return res.status(500).json({ message: 'Server error fetching projects' });
  }
});

// GET /api/projects/:projectId
router.get('/:projectId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    return res.status(200).json(project);
  } catch (err) {
    return res.status(500).json({ message: 'Server error fetching project' });
  }
});

module.exports = router;
