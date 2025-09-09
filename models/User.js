const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    // Cập nhật: Thêm 'moderator' vào danh sách vai trò hợp lệ
    role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
    contributionCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
