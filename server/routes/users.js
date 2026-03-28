/**
 * Users routes
 * PUT /api/users/:userId — update profile fields
 */
const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.put('/:userId', protect, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const { fullName, skillLevel } = req.body;

    if (!fullName && !skillLevel) {
      return res.status(400).json({ message: 'At least one field is required' });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.userId,
      { fullName, skillLevel },
      { new: true }
    ).select('-password');

    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;
