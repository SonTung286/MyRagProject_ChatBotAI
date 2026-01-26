const User = require('../models/User');

module.exports = async function (req, res, next) {
  try {
    // req.user.userId đã có từ authMiddleware chạy trước đó
    const user = await User.findById(req.user.userId);
    
    if (user.role !== 'admin') {
      return res.status(403).json({ error: "Truy cập bị từ chối! Chỉ Admin mới được nạp tài liệu." });
    }
    
    next(); // Là Admin -> Cho qua
  } catch (error) {
    res.status(500).json({ error: "Lỗi server khi kiểm tra quyền." });
  }
};