const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Course = require('../models/Course');
const User = require('../models/User');

// @route   GET api/courses
// @desc    Get all courses with pagination
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        // Cập nhật: Thêm .populate() để lấy thông tin chi tiết của tác giả
        const courses = await Course.find()
            .populate('author', 'username role') // Lấy username và role của tác giả
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalCourses = await Course.countDocuments();
        const totalPages = Math.ceil(totalCourses / limit);

        res.json({
            courses,
            currentPage: page,
            totalPages,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi máy chủ');
    }
});

// @route   POST api/courses
// @desc    Add a new course
router.post('/', auth, async (req, res) => {
    const { title, link, category, description } = req.body;
    try {
        const user = await User.findById(req.user.id);

        const newCourse = new Course({
            title,
            link,
            category,
            description,
            author: req.user.id,
            authorName: user.username 
        });

        const course = await newCourse.save();
        await User.findByIdAndUpdate(req.user.id, { $inc: { contributionCount: 1 } });
        res.json(course);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi máy chủ');
    }
});

// @route   PUT api/courses/:id
// @desc    Update a course
// @access  Private
router.put('/:id', auth, async (req, res) => {
    const { title, link, category, description } = req.body;
    try {
        let course = await Course.findById(req.params.id).populate('author');
        if (!course) return res.status(404).json({ msg: 'Không tìm thấy khóa học' });

        const user = await User.findById(req.user.id);

        // Kiểm tra quyền: chủ sở hữu, admin, hoặc phó quản lý (không sửa bài của admin)
        const isOwner = course.author.id.toString() === user.id;
        const isAdmin = user.role === 'admin';
        const isModerator = user.role === 'moderator';
        const isAuthorAdmin = course.author.role === 'admin';

        if (!isOwner && !isAdmin && !(isModerator && !isAuthorAdmin)) {
            return res.status(401).json({ msg: 'Không có quyền thực hiện hành động này' });
        }
        
        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id,
            { $set: { title, link, category, description } },
            { new: true }
        ).populate('author', 'username role');

        res.json(updatedCourse);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi máy chủ');
    }
});

// @route   DELETE api/courses/:id
// @desc    Delete a course
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        let course = await Course.findById(req.params.id).populate('author');
        if (!course) return res.status(404).json({ msg: 'Không tìm thấy khóa học' });

        const user = await User.findById(req.user.id);
        
        // Kiểm tra quyền tương tự như khi cập nhật
        const isOwner = course.author.id.toString() === user.id;
        const isAdmin = user.role === 'admin';
        const isModerator = user.role === 'moderator';
        const isAuthorAdmin = course.author.role === 'admin';

        if (!isOwner && !isAdmin && !(isModerator && !isAuthorAdmin)) {
            return res.status(401).json({ msg: 'Không có quyền thực hiện hành động này' });
        }

        await Course.findByIdAndDelete(req.params.id);

        // Giảm số lượng đóng góp của tác giả
        await User.findByIdAndUpdate(course.author.id, { $inc: { contributionCount: -1 } });
        
        res.json({ msg: 'Khóa học đã được xóa' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi máy chủ');
    }
});

module.exports = router;
