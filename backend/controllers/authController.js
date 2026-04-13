const authService = require('../services/authService');

exports.register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const result = await authService.verifyOTP(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({ ...result, message: "Đăng nhập thành công!" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (error) {
    const status = error.message === "Email không tồn tại trong hệ thống" ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { password } = req.body;
    const result = await authService.resetPassword(resetToken, password);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- QUẢN LÝ USER (Dành cho Admin) ---

// 1. Lấy danh sách tất cả người dùng
exports.getAllUsers = async (req, res) => {
  try {
    // Gọi Service xử lý, không gọi trực tiếp User.find() ở đây
    const users = await authService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Xóa người dùng
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Gọi Service xử lý logic xóa
    const result = await authService.deleteUser(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};