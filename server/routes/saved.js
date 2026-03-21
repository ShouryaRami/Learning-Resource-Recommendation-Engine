/**
 * Saved resources routes
 * POST   /api/saved                      — save a resource
 * GET    /api/saved                      — get all saved resources for current user
 * DELETE /api/saved/:savedId             — remove a saved resource
 * PATCH  /api/saved/:savedId/complete    — mark a saved resource as complete
 */
const express = require('express');
const SavedResource = require('../models/SavedResource');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/saved
router.post('/', protect, async (req, res) => {
  try {
    const { resourceId, projectId } = req.body;

    if (!resourceId) {
      return res.status(400).json({ message: 'resourceId is required' });
    }

    const existing = await SavedResource.findOne({
      userId: req.user.id,
      resourceId,
    });

    if (existing) {
      return res.status(409).json({ message: 'Resource already saved' });
    }

    const saved = await SavedResource.create({
      userId: req.user.id,
      resourceId,
      projectId: projectId || null,
    });

    return res.status(201).json(saved);
  } catch (err) {
    return res.status(500).json({ message: 'Server error saving resource' });
  }
});

// GET /api/saved
router.get('/', protect, async (req, res) => {
  try {
    const saved = await SavedResource.find({ userId: req.user.id })
      .populate('resourceId')
      .sort({ savedAt: -1 });

    return res.status(200).json(saved);
  } catch (err) {
    return res.status(500).json({ message: 'Server error fetching saved resources' });
  }
});

// DELETE /api/saved/:savedId
router.delete('/:savedId', protect, async (req, res) => {
  try {
    const saved = await SavedResource.findById(req.params.savedId);

    if (!saved) {
      return res.status(404).json({ message: 'Saved resource not found' });
    }

    if (saved.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await SavedResource.findByIdAndDelete(req.params.savedId);
    return res.status(200).json({ message: 'Removed successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error removing saved resource' });
  }
});

// PATCH /api/saved/:savedId/complete
router.patch('/:savedId/complete', protect, async (req, res) => {
  try {
    const saved = await SavedResource.findById(req.params.savedId);

    if (!saved) {
      return res.status(404).json({ message: 'Saved resource not found' });
    }

    if (saved.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    saved.isCompleted = true;
    saved.completedAt = new Date();
    await saved.save();

    return res.status(200).json(saved);
  } catch (err) {
    return res.status(500).json({ message: 'Server error marking complete' });
  }
});

module.exports = router;
