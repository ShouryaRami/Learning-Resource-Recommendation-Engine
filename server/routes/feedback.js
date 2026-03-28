/**
 * Feedback routes
 * POST /api/feedback — submit or update a rating for a resource
 */
const express = require('express');
const { protect } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const Resource = require('../models/Resource');

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { resourceId, rating, comment, helpful, projectId } = req.body;

    if (!resourceId || !rating) {
      return res.status(400).json({ message: 'resourceId and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const existing = await Feedback.findOne({
      userId: req.user.id,
      resourceId,
    });

    if (existing) {
      existing.rating = rating;
      existing.comment = comment || existing.comment;
      existing.helpful = helpful ?? existing.helpful;
      await existing.save();
    } else {
      await Feedback.create({
        userId: req.user.id,
        resourceId,
        rating,
        comment: comment || '',
        helpful: helpful ?? true,
        projectId: projectId || null,
      });
    }

    const allFeedback = await Feedback.find({ resourceId });
    const avg = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;
    const rounded = Math.round(avg * 10) / 10;

    await Resource.findByIdAndUpdate(resourceId, {
      averageRating: rounded,
      totalRatings: allFeedback.length,
    });

    return res.status(201).json({ message: 'Feedback submitted', averageRating: rounded });
  } catch (err) {
    return res.status(500).json({ message: 'Server error submitting feedback' });
  }
});

module.exports = router;
