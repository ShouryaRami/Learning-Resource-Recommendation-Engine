/**
 * Recommendations route — POST /api/recommendations
 * Fetches all active resources, runs the recommendation engine,
 * increments usageCount on returned resources, and optionally
 * caches result IDs on the Project document.
 */
const express = require('express');
const Resource = require('../models/Resource');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const { getRecommendations } = require('../utils/recommendationEngine');

const router = express.Router();

/**
 * @route POST /api/recommendations
 * @desc Generate ranked resource recommendations
 *   based on project domain, language and skill level
 *   Uses the recommendation engine scoring algorithm
 * @access Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { domain, language, skillLevel, timeline, description, projectId } = req.body;

    if (!domain || !language || !skillLevel) {
      return res.status(400).json({ message: 'domain, language and skillLevel are required' });
    }

    const resources = await Resource.find({ isActive: true });

    const input = { domain, language, skillLevel, timeline, description };
    const result = getRecommendations(resources, input);

    if (projectId) {
      await Project.findByIdAndUpdate(projectId, {
        recommendations: result.ranked.map((r) => r._id),
      });
    }

    const rankedIds = result.ranked.map((r) => r._id);
    await Resource.updateMany(
      { _id: { $in: rankedIds } },
      { $inc: { usageCount: 1 } }
    );

    return res.status(200).json({
      ranked: result.ranked,
      learningPath: result.learningPath,
      totalFound: result.totalFound,
      projectId: projectId || null,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error generating recommendations' });
  }
});

module.exports = router;
