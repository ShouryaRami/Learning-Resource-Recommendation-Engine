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

/**
 * @route POST /api/projects
 * @desc Create a new student project
 * @access Private
 */
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

/**
 * @route GET /api/projects/user/:userId
 * @desc Get all projects for a specific user
 * @access Private
 */
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    return res.status(200).json(projects);
  } catch (err) {
    return res.status(500).json({ message: 'Server error fetching projects' });
  }
});

/**
 * @route DELETE /api/projects/:projectId
 * @desc Delete a project by ID
 * @access Private
 */
router.delete('/:projectId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (project.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Project.findByIdAndDelete(req.params.projectId);
    return res.status(200).json({ message: 'Project deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error deleting project' });
  }
});

/**
 * @route GET /api/projects/:projectId
 * @desc Get a single project by ID
 * @access Private
 */
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
