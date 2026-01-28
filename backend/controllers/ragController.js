const ragService = require('../services/ragService');

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

exports.ingestFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Chưa chọn file PDF" });
        
        console.log(`Đang xử lý file: ${req.file.originalname}`); // Giữ log này để biết file nào đang lên
        const result = await ragService.ingestFile(req.file);
        
        res.json(result);
    } catch (error) {
        console.error("Lỗi Upload:", error.message);
        res.status(500).json({ message: "Lỗi xử lý file", error: error.message });
    }
};

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

exports.getUploadedFiles = async (req, res) => {
  try {
    const result = await ragService.getFiles();
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.deleteFile = async (req, res) => {
  try {
    const result = await ragService.deleteFile(req.params.fileName);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
};