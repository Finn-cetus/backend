const jwt = require('jsonwebtoken');

// Logic xác thực token JWT
module.exports = function(req, res, next) {
    // Lấy token từ header
    const token = req.header('x-auth-token');

    // Kiểm tra nếu không có token
    if (!token) {
        return res.status(401).json({ msg: 'Không có token, truy cập bị từ chối' });
    }

    try {
        // Xác thực token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Gán thông tin người dùng từ payload vào request
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token không hợp lệ' });
    }
};
