/**
 * Admin routes
 * GET /api/admin/analytics — real counts for faculty dashboard
 */
const express = require('express');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const User = require('../models/User');
const Project = require('../models/Project');
const SavedResource = require('../models/SavedResource');

const router = express.Router();

router.get('/analytics', protect, adminOnly, async (req, res) => {
  try {
    const [totalStudents, totalProjects, totalSaved, totalCompleted] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Project.countDocuments(),
      SavedResource.countDocuments(),
      SavedResource.countDocuments({ isCompleted: true }),
    ]);
    return res.status(200).json({ totalStudents, totalProjects, totalSaved, totalCompleted });
  } catch (err) {
    return res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

module.exports = router;
