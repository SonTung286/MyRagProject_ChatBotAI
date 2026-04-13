/**
 * API ROUTES
 * Định nghĩa toàn bộ các đường dẫn API của hệ thống.
 */

const express = require('express');
const router = express.Router();

// 👇 QUAN TRỌNG: Dùng Middleware Upload Local (Không dùng Cloudinary nữa)
// Đảm bảo bạn đã tạo file backend/middleware/upload.js như hướng dẫn trước
const upload = require('../middleware/uploadMiddleware'); 

const { validate, schemas } = require('../middleware/validationMiddleware');

// --- IMPORT MIDDLEWARE ---
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// --- IMPORT CONTROLLERS ---
const authController = require('../controllers/authController');
const ragController = require('../controllers/ragController');

// ==========================================
// 1. AUTHENTICATION
// ==========================================
router.post('/register', validate(schemas.register), authController.register);
router.post('/verify-otp', validate(schemas.verifyOTP), authController.verifyOTP);
router.post('/login', validate(schemas.login), authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.put('/auth/reset-password/:resetToken', authController.resetPassword);

// ==========================================
// 2. CHAT & CONVERSATION
// ==========================================
router.post('/chat', authMiddleware, validate(schemas.chat), ragController.chatWithAI);
router.get('/conversations', authMiddleware, ragController.getConversations);
router.get('/messages/:conversationId', authMiddleware, ragController.getMessages);
router.delete('/conversations/:conversationId', authMiddleware, ragController.deleteConversation);

// ==========================================
// 3. ADMIN MANAGEMENT (Đã sửa lại Route chuẩn)
// ==========================================

// ✅ Route 1: Thống kê Dashboard
router.get('/admin/stats', 
    // authMiddleware, // Bật lại khi cần bảo mật
    ragController.getDashboardStats
);

// ✅ Route 2: Upload file (Local)
// Frontend gọi: POST /api/admin/upload
router.post('/admin/upload', 
    authMiddleware, 
    // adminMiddleware, // Tạm tắt nếu bạn lười set quyền Admin trong DB
    upload.single('file'), 
    ragController.ingestFile
);

// ✅ Route 3: Xóa file
// Frontend gọi: DELETE /api/admin/file/:filename
router.delete('/admin/file/:filename', 
    authMiddleware, 
    // adminMiddleware, 
    ragController.deleteFile
);

// (Giữ lại route cũ nếu sợ lỗi backward compatibility, nhưng frontend mới không dùng cái này)
router.get('/admin/files', authMiddleware, ragController.getUploadedFiles);

// Lấy danh sách user
router.get('/admin/users', authMiddleware, authController.getAllUsers);

// Xóa user
router.delete('/admin/users/:id', authMiddleware, authController.deleteUser);

module.exports = router;