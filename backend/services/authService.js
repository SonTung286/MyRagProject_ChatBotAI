/**
 * AUTH SERVICE LAYER (FINAL)
 * Chứa logic đăng ký, đăng nhập, mã hóa, JWT, OTP và Quản lý User.
 */

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

// Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  }
});

class AuthService {
  
  // --- 1. AUTHENTICATION ---

  async register({ username, password, email }) {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      if (!existingUser.isVerified) {
        await User.deleteOne({ _id: existingUser._id });
      } else {
        throw new Error("Tài khoản hoặc Email đã tồn tại!");
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    const newUser = new User({
      username, email, password: hashedPassword,
      otp, otpExpires, isVerified: false
    });
    await newUser.save();

    await this.sendOtpEmail(email, otp);

    return { email, message: "Đăng ký thành công! Hãy kiểm tra Email." };
  }

  async sendOtpEmail(email, otp) {
    const htmlContent = `
      <div style="padding: 20px; border: 1px solid #ddd; font-family: sans-serif;">
        <h2 style="color: #0044cc;">Tech-Demo AI Security</h2>
        <p>Xin chào,</p>
        <p>Mã xác thực (OTP) của bạn là:</p>
        <div style="background: #f4f4f4; padding: 10px; font-size: 24px; font-weight: bold; color: #d93025; letter-spacing: 5px;">
          ${otp}
        </div>
        <p>Mã này có hiệu lực trong 10 phút.</p>
      </div>
    `;
    await transporter.sendMail({
      from: '"Tech-Demo AI" <doansontung2862004@gmail.com>',
      to: email, 
      subject: 'Mã xác thực đăng ký tài khoản', 
      html: htmlContent
    });
  }

  async verifyOTP({ email, otp }) {
    const user = await User.findOne({ email });
    if (!user) throw new Error("Không tìm thấy tài khoản với email này.");
    if (user.isVerified) return { message: "Tài khoản này đã được xác thực trước đó." };

    if (user.otp !== otp) throw new Error("Mã OTP không chính xác!");
    if (user.otpExpires < Date.now()) throw new Error("Mã OTP đã hết hạn! Vui lòng đăng ký lại.");

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return { message: "Xác thực thành công! Bạn có thể đăng nhập ngay." };
  }

  async login({ username, password }) {
    const user = await User.findOne({ username });
    if (!user) throw new Error("Sai tài khoản hoặc mật khẩu!");
    
    if (!user.isVerified) throw new Error("Tài khoản chưa kích hoạt! Vui lòng kiểm tra email.");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Sai tài khoản hoặc mật khẩu!");

    const token = jwt.sign(
        { userId: user._id, role: user.role }, // Thêm role vào token để tiện check quyền
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
    );

    return {
      token,
      username: user.username,
      role: user.role
    };
  }

  // --- 2. PASSWORD MANAGEMENT ---

  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) throw new Error("Email không tồn tại trong hệ thống");

    const resetToken = uuidv4(); 
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; 
    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    const message = `Bạn vừa yêu cầu đặt lại mật khẩu. Click vào link này để đổi mật khẩu mới:\n\n${resetUrl}\n\nLink này sẽ hết hạn sau 10 phút.`;

    try {
      await transporter.sendMail({
        from: '"Tech-Demo AI" <doansontung2862004@gmail.com>',
        to: user.email,
        subject: 'Đặt lại mật khẩu - Tech Demo AI',
        text: message
      });
      return { message: "Email xác nhận đã được gửi!" };
    } catch (err) {
      console.error("Lỗi gửi mail:", err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      throw new Error("Không thể gửi email. Vui lòng thử lại sau.");
    }
  }

  async resetPassword(token, newPassword) {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) throw new Error("Token không hợp lệ hoặc đã hết hạn");

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return { message: "Mật khẩu đã được cập nhật thành công!" };
  }

  // --- 3. USER MANAGEMENT (ADMIN) ---

  // Lấy danh sách user
  async getAllUsers() {
    // Lấy tất cả user, trừ password, sắp xếp mới nhất lên đầu
    return await User.find().select('-password').sort({ createdAt: -1 });
  }

  // Xóa user
  async deleteUser(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("Người dùng không tồn tại");
    
    // (Tùy chọn) Chặn xóa admin
    if (user.role === 'admin') throw new Error("Không thể xóa tài khoản Admin!");

    await User.findByIdAndDelete(userId);
    return { message: "Đã xóa người dùng thành công" };
  }
}

module.exports = new AuthService();