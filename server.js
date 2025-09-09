require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Hàm tạo tài khoản admin mặc định
const seedAdminUser = async () => {
    try {
        const adminEmail = 'chungdayy2006@gmail.com';
        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admindeptrai3112', salt);
            
            const adminUser = new User({
                username: 'admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin'
            });
            
            await adminUser.save();
            console.log('Admin user has been created successfully.');
        }
    } catch (error) {
        console.error('Error seeding admin user:', error.message);
    }
};

// Kết nối tới MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connected successfully');
    seedAdminUser(); // Gọi hàm sau khi kết nối thành công
}).catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
    res.send('CourseHub Infinity API is running!');
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/users', require('./routes/users')); // Thêm route cho user

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
