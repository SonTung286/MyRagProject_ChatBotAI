/**
 * API ROUTES
 * Định nghĩa toàn bộ các đường dẫn API của hệ thống.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary'); // Lấy cấu hình Cloudinary đã tạo
const { validate, schemas } = require('../middleware/validationMiddleware');

// Cấu hình Upload (Sử dụng Cloudinary Storage)
const upload = multer({ storage });

// --- IMPORT MIDDLEWARE ---
const authMiddleware = require('../middleware/authMiddleware'); // Kiểm tra đăng nhập
const adminMiddleware = require('../middleware/adminMiddleware'); // Kiểm tra quyền Admin

// --- IMPORT CONTROLLERS ---
const authController = require('../controllers/authController');
const ragController = require('../controllers/ragController');

// ==========================================
// 1. AUTHENTICATION (Xác thực người dùng)
// ==========================================

// Đăng ký tài khoản mới (Gửi OTP về mail)
router.post('/register', validate(schemas.register), authController.register);

// Xác thực OTP (Kích hoạt tài khoản)
router.post('/verify-otp', validate(schemas.verifyOTP), authController.verifyOTP);

// Đăng nhập (Trả về Token)
router.post('/login', validate(schemas.login), authController.login);


// ==========================================
// 2. CHAT & CONVERSATION (Dành cho User)
// ==========================================

// Chat với AI (Tự động lưu lịch sử)
router.post('/chat', authMiddleware, validate(schemas.chat), ragController.chatWithAI);

// Lấy danh sách các cuộc hội thoại (Cho Sidebar)
router.get('/conversations', authMiddleware, ragController.getConversations);

// Lấy chi tiết tin nhắn của 1 cuộc hội thoại
router.get('/messages/:conversationId', authMiddleware, ragController.getMessages);

// Xóa một cuộc hội thoại
router.delete('/conversations/:conversationId', authMiddleware, ragController.deleteConversation);


// ==========================================
// 3. ADMIN MANAGEMENT (Quản lý tài liệu)
// ==========================================

// Upload file PDF lên Cloud & Vector Database
// (Chạy authMiddleware -> adminMiddleware -> upload -> xử lý logic)
router.post('/ingest-file', 
  authMiddleware, 
  adminMiddleware, 
  upload.single('file'), 
  ragController.ingestFile
);

// Lấy danh sách các file đã upload
router.get('/admin/files', 
  authMiddleware, 
  adminMiddleware, 
  ragController.getUploadedFiles
);

// Xóa file (Xóa trong DB)
router.delete('/admin/files/:fileName', 
  authMiddleware, 
  adminMiddleware, 
  ragController.deleteFile
);

module.exports = router;