/**
 * SERVER ENTRY POINT
 * Khởi tạo Express App, Kết nối Database và Cấu hình Middleware.
 */

require('dotenv').config(); // Nạp biến môi trường đầu tiên
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/api');

// Khởi tạo App
const app = express();
const PORT = process.env.PORT || 5000;

// --- 1. MIDDLEWARES ---
app.use(express.json()); // Cho phép đọc JSON từ body
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// --- 2. KẾT NỐI DATABASE (MONGODB) ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1); // Dừng app nếu không kết nối được DB
  }
};

// --- 3. ROUTES ---
app.use('/api', apiRoutes);

// Route kiểm tra sức khỏe server (Health Check)
app.get('/', (req, res) => {
  res.send('RAG AI Chatbot Server is Running... 🚀');
});

// --- 4. GLOBAL ERROR HANDLER (Bắt lỗi toàn cục) ---
// Giúp server không bị crash khi có lỗi bất ngờ
app.use((err, req, res, next) => {
  console.error("🔥 Global Error:", err.stack);
  res.status(500).json({ error: "Đã xảy ra lỗi hệ thống nghiêm trọng!" });
});

// --- 5. KHỞI CHẠY SERVER ---

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});