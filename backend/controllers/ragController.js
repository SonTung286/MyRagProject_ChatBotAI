const ragService = require('../services/ragService');

exports.chatWithAI = async (req, res) => {
    console.log("\n--- BẮT ĐẦU REQUEST CHAT ---");
    console.log("1. Body nhận được:", req.body);
    console.log("2. User Info:", req.user);

    try {
        const { question, conversationId } = req.body;
        const userId = req.user ? (req.user.userId || req.user._id) : null; // Lấy ID an toàn hơn

        if (!question) {
            console.log("❌ Lỗi: Không có câu hỏi");
            return res.status(400).json({ message: "Vui lòng nhập câu hỏi" });
        }

        if (!userId) {
            console.log("❌ Lỗi: Không tìm thấy User ID (Lỗi Auth)");
            return res.status(401).json({ message: "Bạn chưa đăng nhập" });
        }

        console.log("3. Đang gọi RagService...");
        const result = await ragService.chat(userId, question, conversationId);
        
        console.log("✅ Chat thành công! Đang trả về client.");
        res.json(result);

    } catch (error) {
        // ĐÂY LÀ DÒNG QUAN TRỌNG NHẤT ĐỂ HIỆN LỖI RA TERMINAL
        console.error("\n🔥 LỖI NGHIÊM TRỌNG TẠI CONTROLLER:");
        console.error(error); 
        
        res.status(500).json({ 
            message: "Lỗi Server", 
            error: error.message // Gửi chi tiết lỗi về Frontend để dễ debug
        });
    }
};

exports.ingestFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Chưa chọn file" });
        }
        console.log("Đang xử lý file:", req.file.originalname);
        
        const result = await ragService.ingestFile(req.file);
        res.json(result);
    } catch (error) {
        console.error("Lỗi Upload:", error);
        res.status(500).json({ message: error.message });
    }
};

// ... Các hàm khác giữ nguyên hoặc thêm console.error tương tự

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