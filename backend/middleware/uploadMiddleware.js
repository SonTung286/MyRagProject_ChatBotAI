const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Tạo thư mục 'uploads' ở backend nếu chưa có
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Cấu hình lưu file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Lưu vào folder uploads
  },
  filename: (req, file, cb) => {
    // Thêm số ngẫu nhiên vào tên để tránh trùng file
    // Ví dụ: tai_lieu.pdf -> 172399_tai_lieu.pdf
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// 3. Chỉ nhận PDF
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file định dạng PDF!'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // Giới hạn 10MB
});

module.exports = upload;