const ragService = require('../services/ragService');
const User = require('../models/User');
const Conversation = require('../models/Conversation');

// 1. CHAT
exports.chatWithAI = async (req, res) => {
    try {
        const { question, conversationId } = req.body;
        const userId = req.user ? (req.user.userId || req.user._id) : null;

        if (!question) return res.status(400).json({ message: "Vui lòng nhập câu hỏi" });
        if (!userId) return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ" });

        const result = await ragService.chat(userId, question, conversationId);
        res.json(result);
    } catch (error) {
        console.error("Lỗi Chat:", error.message);
        res.status(500).json({ message: "Lỗi xử lý tin nhắn", error: error.message });
    }
};

// 2. UPLOAD FILE (ADMIN)
exports.ingestFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Chưa chọn file PDF" });
        
        console.log(`[Admin] Đang nạp file: ${req.file.originalname}`);
        
        // Gọi Service xử lý file local
        const result = await ragService.ingestFile(req.file);
        
        res.json(result);
    } catch (error) {
        console.error("Lỗi Upload:", error.message);
        res.status(500).json({ message: "Lỗi xử lý file", error: error.message });
    }
};

// 3. XÓA FILE (ADMIN) - Sửa lỗi params
exports.deleteFile = async (req, res) => {
    try {
        // 👇 QUAN TRỌNG: Phải dùng 'filename' (chữ thường) khớp với Route
        const { filename } = req.params; 
        console.log(`[Admin] Yêu cầu xóa file: ${filename}`);

        const result = await ragService.deleteFile(filename);
        res.json(result);
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
};

// 4. DASHBOARD STATS (ADMIN)
exports.getDashboardStats = async (req, res) => {
    try {
        const files = await ragService.getFiles();
        const totalDocs = files.length;
        const totalChunks = files.reduce((acc, curr) => acc + curr.chunks, 0);

        const totalUsers = await User.countDocuments();
        const totalConvs = await Conversation.countDocuments();

        res.json({
            stats: { totalDocs, totalChunks, totalUsers, totalConvs },
            systemStatus: {
                aiModel: "DeepSeek-R1 (8B)",
                embedding: "Snowflake Arctic",
                status: "Online"
            },
            fileList: files
        });
    } catch (error) {
        console.error("Lỗi Dashboard:", error);
        res.status(500).json({ error: "Lỗi lấy dữ liệu thống kê" });
    }
};

// --- CÁC HÀM CŨ (User/Chat) ---
exports.getConversations = async (req, res) => {
  try {
    const result = await ragService.getConversations(req.user.userId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getMessages = async (req, res) => {
  try {
    const result = await ragService.getMessages(req.params.conversationId, req.user.userId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.deleteConversation = async (req, res) => {
  try {
    const result = await ragService.deleteConversation(req.params.conversationId, req.user.userId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// Hàm này giữ lại để tương thích nếu cần, nhưng Dashboard dùng getDashboardStats rồi
exports.getUploadedFiles = async (req, res) => {
  try {
    const result = await ragService.getFiles();
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
};