const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const User = require('../models/User');

// @route   GET api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', [auth, admin], async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/admin/users/:id/role
// @desc    Update user role
// @access  Admin
router.put('/users/:id/role', [auth, admin], async (req, res) => {
    const { role } = req.body;
    if (role !== 'user' && role !== 'moderator') {
        return res.status(400).json({ msg: 'Invalid role specified' });
    }

    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        
        // Admin cannot be demoted
        if(user.role === 'admin') {
            return res.status(400).json({ msg: 'Cannot change the role of an admin' });
        }

        user.role = role;
        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
