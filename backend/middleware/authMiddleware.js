const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Lấy token từ header (x-auth-token hoặc Authorization)
  const token = req.header('x-auth-token');

  // Nếu không có token -> Đuổi về
  if (!token) {
    return res.status(401).json({ error: "Không có quyền truy cập. Vui lòng đăng nhập!" });
  }

  try {
    // Giải mã token xem có hợp lệ không
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Lưu thông tin user vào biến req để dùng sau này
    next(); // Cho phép đi tiếp vào trong
  } catch (error) {
    res.status(401).json({ error: "Token không hợp lệ!" });
  }
};