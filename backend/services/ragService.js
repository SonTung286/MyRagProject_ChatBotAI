/**
 * RAG SERVICE LAYER
 * Chứa toàn bộ logic nghiệp vụ (Business Logic) liên quan đến AI và Tài liệu.
 * Controller chỉ việc gọi hàm từ đây mà không cần biết AI chạy thế nào.
 */

const Document = require('../models/Document');
const ChatHistory = require('../models/ChatHistory');
const Conversation = require('../models/Conversation');
const { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const pdf = require('pdf-parse');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Khởi tạo AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ 
    model: "gemini-embedding-001" 
});

// 2. KHỞI TẠO LLM (SỬ DỤNG LANGCHAIN ĐỂ QUẢN LÝ CHAT)
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
});

class RagService {

  // --- LOGIC 1: CHAT ---
  /**
   * Xử lý logic Chat thông minh với AI (Có RAG)
   * @param {string} userId - ID của người dùng đang chat
   * @param {string} question - Câu hỏi người dùng nhập
   * @param {string} conversationId - ID cuộc hội thoại (nếu có)
   * @returns {Promise<Object>} - Trả về câu trả lời, nguồn và conversationId mới
   */

async getEmbedding(text) {
      try {
          const result = await embeddingModel.embedContent(text);
          return result.embedding.values;
      } catch (error) {
          console.error("Lỗi Google Embedding:", error.message);
          throw new Error("Lỗi tạo vector. Vui lòng kiểm tra lại API Key.");
      }
  }

  async chat(userId, question, conversationId) {
    // 1. Nếu chưa có conversationId (Chat mới) -> Tạo Session mới trong DB
    let currentConvId = conversationId;
    if (!currentConvId) {
      const newConv = await Conversation.create({
        user: userId,
        title: question.substring(0, 40) + "..." // Lấy 40 ký tự đầu làm tiêu đề
      });
      currentConvId = newConv._id;
    }

    // 2. Logic kiểm tra xã giao (Tránh tốn tiền/token AI đọc tài liệu không cần thiết)
    // Regex cho phép "Xin chào" ở đầu câu, chấp nhận dấu câu phía sau
    const greetingRegex = /^(xin chào|hi|hello|chào bạn|chào ad|chào bot|chào)/i;
    if (greetingRegex.test(question.trim())) {
      const greetingMsg = "Chào bạn! Tôi là trợ lý ảo Tech-Demo. Tôi có thể giúp gì cho bạn?";
      // Lưu tin nhắn xã giao vào lịch sử chat
      await this.saveHistory(currentConvId, userId, question, greetingMsg, []);
      return { answer: greetingMsg, sources: [], conversationId: currentConvId };
    }

    // 3. Tìm kiếm Vector (RAG Core)
    // Chuyển câu hỏi thành vector số học
    const questionVector = await this.getEmbedding(question);
    
    // Tìm 3 đoạn văn bản (limit: 3) trong DB có vector gần giống nhất
    const results = await Document.aggregate([
      {
        "$vectorSearch": {
          "index": "vector_index", "path": "embedding", "queryVector": questionVector,
          "numCandidates": 100, "limit": 3
        }
      },
      { "$project": { "content": 1, "metadata": 1, "_id": 0 } }
    ]);

    // 4. Tạo Prompt (Kịch bản) cho AI
    const context = results.length > 0 ? results.map(d => d.content).join("\n---\n") : "Không có thông tin trong tài liệu.";
    const prompt = `
      VAI TRÒ CỦA BẠN:
      Bạn là Trợ lý AI Hỗ trợ Nhân viên (HR Support) của công ty Tech-Demo.
      Người đang chat với bạn là một nhân viên trong công ty.
      
      NHIỆM VỤ:
      Trả lời câu hỏi của nhân viên dựa trên "KHO DỮ LIỆU NỘI BỘ" được cung cấp bên dưới.
      
      QUY TẮC TRẢ LỜI QUAN TRỌNG:
      1. Tuyệt đối KHÔNG nói câu: "Dựa vào tài liệu bạn cung cấp" (Vì nhân viên không phải là người nạp tài liệu).
      2. Hãy dùng các cụm từ thay thế như: "Theo quy định của công ty...", "Dựa trên tài liệu nội bộ...", "Theo chính sách Tech-Demo...".
      3. Giọng văn: Chuyên nghiệp, thân thiện, ngắn gọn và đi thẳng vào vấn đề.
      4. Nếu thông tin không có trong Kho dữ liệu: Hãy xin lỗi và nói rằng bạn chưa tìm thấy thông tin trong các văn bản hiện hành.

      KHO DỮ LIỆU NỘI BỘ:
      ${context}

      CÂU HỎI CỦA NHÂN VIÊN: 
      "${question}"
    `;
    
    const response = await llm.invoke(prompt);

    // 5. Lưu và Trả về kết quả
    const sources = results.map(r => r.metadata.source);
    await this.saveHistory(currentConvId, userId, question, response.content, sources);

    return {
      answer: response.content,
      sources: results.map(r => ({ source: r.metadata.source, content: r.content })),
      conversationId: currentConvId
    };
  }

  /**
   * Helper: Lưu lịch sử chat vào MongoDB
   */
  async saveHistory(convId, userId, userMsg, botMsg, sources) {
    await ChatHistory.create({ conversationId: convId, user: userId, role: 'user', content: userMsg });
    await ChatHistory.create({ conversationId: convId, user: userId, role: 'bot', content: botMsg, sources });
  }

  // --- LOGIC 2: QUẢN LÝ DỮ LIỆU ---
  /**
   * Xử lý file PDF upload lên: Tải về -> Đọc -> Cắt nhỏ -> Vector hóa -> Lưu DB
   * @param {Object} file - Object file từ Multer (có path Cloudinary)
   */
  async ingestFile(file) {
    if (!file) throw new Error("Chưa chọn file!");
    
    // Tải file từ URL Cloudinary về bộ nhớ đệm (Buffer)
    const response = await axios.get(file.path, { responseType: 'arraybuffer' });
    const data = await pdf(response.data);
    const text = data.text;

    if (!text || text.length < 10) throw new Error("File không có nội dung.");

    // Chia nhỏ văn bản (Chunking) để tìm kiếm chính xác hơn
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const output = await splitter.createDocuments([text]);

    // Vector hóa từng đoạn và lưu vào DB
    for (const chunk of output) {
      const vector = await this.getEmbedding(chunk.pageContent);
      await Document.create({
        content: chunk.pageContent,
        metadata: { source: file.originalname, cloudLink: file.path },
        embedding: vector
      });
    }
    return { message: "Nạp file thành công!" };
  }

  // --- CÁC HÀM CRUD CƠ BẢN ---

  async getConversations(userId) {
    return await Conversation.find({ user: userId }).sort({ createdAt: -1 });
  }

  async getMessages(convId, userId) {
    // Check quyền: Chỉ chủ sở hữu mới được xem tin nhắn
    const conv = await Conversation.findOne({ _id: convId, user: userId });
    if (!conv) throw new Error("Không có quyền truy cập");
    return await ChatHistory.find({ conversationId: convId }).sort({ createdAt: 1 });
  }

  async deleteConversation(convId, userId) {
    const conv = await Conversation.findOne({ _id: convId, user: userId });
    if (!conv) throw new Error("Không có quyền xóa");

    // Xóa cả tin nhắn con và session cha
    await ChatHistory.deleteMany({ conversationId: convId });
    await Conversation.findByIdAndDelete(convId);
    return { message: "Đã xóa hội thoại" };
  }

  // Admin Only
  async getFiles() {
    // Group by tên file để đếm số lượng chunk
    const files = await Document.aggregate([
      { $group: { _id: "$metadata.source", totalChunks: { $sum: 1 }, lastUploaded: { $max: "$_id" } } },
      { $sort: { lastUploaded: -1 } }
    ]);
    return files.map(f => ({ name: f._id, chunks: f.totalChunks }));
  }

  async deleteFile(fileName) {
    const result = await Document.deleteMany({ "metadata.source": fileName });
    if (result.deletedCount === 0) throw new Error("File không tồn tại");
    return { message: `Đã xóa file ${fileName}` };
  }
}

module.exports = new RagService();