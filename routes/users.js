const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');

// @route   GET api/users/me
// @desc    Get current user profile and contributions
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        const courses = await Course.find({ author: req.user.id }).sort({ createdAt: -1 });
        res.json({ user, courses });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/users/top-contributors
// @desc    Get top 5 contributors
// @access  Public
router.get('/top-contributors', async (req, res) => {
    try {
        const topUsers = await User.find({ contributionCount: { $gt: 0 } })
            .sort({ contributionCount: -1 })
            .limit(5)
            .select('username contributionCount');
        res.json(topUsers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
