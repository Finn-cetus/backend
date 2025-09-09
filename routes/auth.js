const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');

// @route   POST api/auth/register
// @desc    Register a user
router.post(
    '/register',
    [
        check('username', 'Tên đăng nhập là bắt buộc').not().isEmpty(),
        check('email', 'Vui lòng nhập một email hợp lệ').isEmail(),
        check('password', 'Mật khẩu phải có ít nhất 6 ký tự').isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ msg: errors.array()[0].msg });
        }

        const { username, email, password } = req.body;

        try {
            let user = await User.findOne({ $or: [{ email }, { username }] });
            if (user) {
                return res.status(400).json({ msg: 'Email hoặc tên đăng nhập đã tồn tại' });
            }

            user = new User({ username, email, password });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();

            // Thêm 'role' vào JWT payload
            const payload = { user: { id: user.id, username: user.username, role: user.role } };
            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
                if (err) throw err;
                res.json({ token });
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Lỗi máy chủ');
        }
    }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post(
    '/login',
    [
        check('email', 'Vui lòng nhập email hoặc tên đăng nhập').not().isEmpty(),
        check('password', 'Mật khẩu là bắt buộc').exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ msg: errors.array()[0].msg });
        }

        const { email, password } = req.body;

        try {
            let user = await User.findOne({ $or: [{ email: email }, { username: email }] });
            if (!user) {
                return res.status(400).json({ msg: 'Thông tin đăng nhập không hợp lệ' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Thông tin đăng nhập không hợp lệ' });
            }

            // Thêm 'role' vào JWT payload
            const payload = { user: { id: user.id, username: user.username, role: user.role } };
            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
                if (err) throw err;
                res.json({ token });
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Lỗi máy chủ');
        }
    }
);

module.exports = router;
