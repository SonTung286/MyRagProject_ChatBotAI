/**
 * AUTH SERVICE LAYER
 * Chứa logic đăng ký, đăng nhập, mã hóa mật khẩu, JWT và gửi Email OTP.
 */

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Cấu hình Nodemailer với Gmail
// Cần sử dụng App Password từ Google Account Security
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'doansontung2862004@gmail.com',
    pass: 'dxdeb snlg tosc wzoe' 
  }
});

class AuthService {
  
  /**
   * Đăng ký tài khoản mới
   * @returns {Object} - Trả về message và email để frontend chuyển trang
   */
  async register({ username, password, email }) {
    // Kiểm tra trùng lặp (Username hoặc Email)
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      // Nếu user đã có trong DB nhưng CHƯA verify OTP -> Xóa đi để đăng ký lại
      if (!existingUser.isVerified) {
        await User.deleteOne({ _id: existingUser._id });
      } else {
        throw new Error("Tài khoản hoặc Email đã tồn tại!");
      }
    }

    // Mã hóa mật khẩu (Hashing)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo OTP 6 số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // Hết hạn sau 10 phút

    // Lưu User tạm thời (isVerified = false)
    const newUser = new User({
      username, email, password: hashedPassword,
      otp, otpExpires, isVerified: false
    });
    await newUser.save();

    // Gửi OTP qua email
    await this.sendOtpEmail(email, otp);

    return { email, message: "Đăng ký thành công! Hãy kiểm tra Email." };
  }

  /**
   * Helper function: Gửi email HTML (Private)
   */
  async sendOtpEmail(email, otp) {
    const htmlContent = `
      <div style="padding: 20px; border: 1px solid #ddd; font-family: sans-serif;">
        <h2 style="color: #0044cc;">Tech-Demo AI Security</h2>
        <p>Xin chào,</p>
        <p>Mã xác thực (OTP) của bạn là:</p>
        <div style="background: #f4f4f4; padding: 10px; font-size: 24px; font-weight: bold; color: #d93025; letter-spacing: 5px;">
          ${otp}
        </div>
        <p>Mã này có hiệu lực trong 10 phút. Vui lòng không chia sẻ cho người khác.</p>
      </div>
    `;
    await transporter.sendMail({
      to: email, subject: 'Mã xác thực đăng ký tài khoản', html: htmlContent
    });
  }

  /**
   * Xác thực mã OTP người dùng nhập
   */
  async verifyOTP({ email, otp }) {
    const user = await User.findOne({ email });
    if (!user) throw new Error("Không tìm thấy tài khoản với email này.");
    if (user.isVerified) return { message: "Tài khoản này đã được xác thực trước đó." };

    if (user.otp !== otp) throw new Error("Mã OTP không chính xác!");
    if (user.otpExpires < Date.now()) throw new Error("Mã OTP đã hết hạn! Vui lòng đăng ký lại.");

    // Active tài khoản
    user.isVerified = true;
    user.otp = undefined; // Xóa OTP đã dùng để tiết kiệm bộ nhớ
    user.otpExpires = undefined;
    await user.save();

    return { message: "Xác thực thành công! Bạn có thể đăng nhập ngay." };
  }

  /**
   * Đăng nhập & Cấp Token
   */
  async login({ username, password }) {
    const user = await User.findOne({ username });
    if (!user) throw new Error("Sai tài khoản hoặc mật khẩu!");
    
    // Bắt buộc phải Verify OTP mới được login
    if (!user.isVerified) throw new Error("Tài khoản chưa kích hoạt! Vui lòng kiểm tra email.");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Sai tài khoản hoặc mật khẩu!");

    // Tạo JWT Token (Hết hạn sau 1 giờ)
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return {
      token,
      username: user.username,
      role: user.role
    };
  }
}

module.exports = new AuthService();