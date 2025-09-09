const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Course = require('../models/Course');
const User = require('../models/User'); // Import User model

// @route   GET api/courses
// @desc    Get all courses with pagination
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const courses = await Course.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalCourses = await Course.countDocuments();
        const totalPages = Math.ceil(totalCourses / limit);

        res.json({
            courses,
            currentPage: page,
            totalPages,
            totalCourses
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/courses
// @desc    Add a new course
// @access  Private
router.post('/', auth, async (req, res) => {
    const { title, link, category, description } = req.body;

    try {
        const newCourse = new Course({
            title,
            link,
            category,
            description,
            author: req.user.id,
            authorName: req.user.username
        });

        const course = await newCourse.save();

        // Cập nhật bộ đếm đóng góp của người dùng
        await User.findByIdAndUpdate(req.user.id, { $inc: { contributionCount: 1 } });

        res.json(course);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
