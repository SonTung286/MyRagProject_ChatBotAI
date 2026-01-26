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