const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true }, // Bắt buộc có email
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  // --- Thêm phần xác thực ---
  isVerified: { type: Boolean, default: false }, // Chưa xác thực thì chưa đăng nhập được
  otp: { type: String },
  otpExpires: { type: Date },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);