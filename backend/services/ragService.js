/**
 * RAG SERVICE LAYER - PHIÊN BẢN LOCAL AI (FINAL)
 * Model: DeepSeek-R1 + Snowflake Embed
 */

const Document = require('../models/Document');
const ChatHistory = require('../models/ChatHistory');
const Conversation = require('../models/Conversation');
const { ChatOllama, OllamaEmbeddings } = require("@langchain/ollama");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const pdf = require('pdf-parse');
const fs = require('fs'); // 👈 QUAN TRỌNG: Phải có fs để đọc file local

// 1. CẤU HÌNH EMBEDDING (Snowflake)
const embeddingModel = new OllamaEmbeddings({
  model: "snowflake-arctic-embed2",
  baseUrl: "http://127.0.0.1:11434",
});

// 2. CẤU HÌNH CHAT MODEL (DeepSeek-R1)
const llm = new ChatOllama({
  model: "deepseek-r1:8b", // Hoặc 8b nếu máy mạnh
  temperature: 0.3, 
  baseUrl: "http://127.0.0.1:11434",
});

class RagService {

  // --- LOGIC 1: CHAT ---

  async getEmbedding(text) {
      try {
          return await embeddingModel.embedQuery(text);
      } catch (error) {
          console.error("Lỗi Ollama Embedding:", error.message);
          throw new Error("Lỗi kết nối Local AI. Hãy bật Ollama!");
      }
  }

  async chat(userId, question, conversationId) {
    let currentConvId = conversationId;
    if (!currentConvId) {
      const newConv = await Conversation.create({
        user: userId,
        title: question.substring(0, 40) + "..."
      });
      currentConvId = newConv._id;
    }

    const greetingRegex = /^(xin chào|hi|hello|chào bạn|chào ad|chào bot|chào)/i;
    if (greetingRegex.test(question.trim())) {
      const greetingMsg = "Chào bạn! Tôi là trợ lý ảo Tech-Demo. Tôi có thể giúp gì cho bạn?";
      await this.saveHistory(currentConvId, userId, question, greetingMsg, []);
      return { answer: greetingMsg, sources: [], conversationId: currentConvId };
    }

    console.log("--> [1] Đang tạo vector câu hỏi...");
    const questionVector = await this.getEmbedding(question);
    
    console.log("--> [2] Đang tìm kiếm (Limit: 10)...");
    const results = await Document.aggregate([
      {
        "$vectorSearch": {
          "index": "vector_index", 
          "path": "embedding", 
          "queryVector": questionVector,
          "numCandidates": 100, 
          "limit": 10 
        }
      },
      { "$project": { "content": 1, "metadata": 1, "_id": 0, "score": { "$meta": "vectorSearchScore" } } }
    ]);

    const validResults = results.filter(r => r.score > 0.35); 
    console.log(`--> Tìm thấy ${validResults.length} đoạn văn.`);

    let answerText = "";
    let sources = [];

    if (validResults.length === 0) {
        answerText = "Xin lỗi bạn, hiện tại tôi chưa tìm thấy thông tin cụ thể về vấn đề này trong các văn bản quy định. 😓\n\nĐể đảm bảo thông tin chính xác nhất, bạn vui lòng liên hệ trực tiếp với **Phòng Nhân sự (HR)** hoặc **Quản lý trực tiếp** để được giải đáp nhé.";
    } else {
        const context = validResults.map(d => d.content).join("\n---\n");
        sources = validResults.map(r => r.metadata.source);

        // PROMPT MỚI: CỤ THỂ HƠN ĐỂ TRÁNH LỖI "VẸT"
        const prompt = `
          Bạn là một chuyên gia nhân sự (HR) chuyên nghiệp. Nhiệm vụ của bạn là trả lời câu hỏi dựa CHÍNH XÁC vào văn bản cung cấp dưới đây.

          DỮ LIỆU NỀN TẢNG:
          """
          ${context}
          """

          CÂU HỎI CỦA NGƯỜI DÙNG: 
          "${question}"

          QUY TẮC TRẢ LỜI NGHIÊM NGẶT:
          1. 🎨 TRÌNH BÀY ĐẸP:
             - Sử dụng gạch đầu dòng.
             - Chỉ in đậm các **từ khóa quan trọng** hoặc **con số** (Tuyệt đối KHÔNG in đậm cả một câu dài).
             - Xuống dòng giữa các ý để dễ đọc.

          2. 🧮 LOGIC SỐ HỌC (QUAN TRỌNG):
            ⚠️ CHIẾN THUẬT XỬ LÝ (BẮT BUỘC):
            Bước 1: "SCAN" dữ liệu. Nếu thấy các quy định dạng liệt kê (như: từ A% đến B% được X người; từ B% đến C% được Y người...), hãy bóc tách ra từng cặp điều kiện.
             - Ví dụ trong đầu bạn phải hình dung:
               + 10-20% -> 01 người
               + 20-30% -> 02 người
               + ...
            Bước 2: Xác định con số trong câu hỏi (Ví dụ: 15%).
            Bước 3: Đối chiếu con số đó nằm trong khoảng nào của Bước 1.
            Bước 4: Lấy chính xác kết quả của khoảng đó. TUYỆT ĐỐI KHÔNG lấy kết quả của dòng bên cạnh.

          3. ✂️ NGẮN GỌN & SÚC TÍCH:
             - Trả lời thẳng vào câu hỏi.
             - Bỏ qua các thông tin rườm rà, thủ tục không liên quan (trừ khi được hỏi).
             - Không lặp lại câu hỏi hay chào hỏi sáo rỗng.

          4. 🛡️ TRUNG THỰC:
             - Nếu không tìm thấy thông tin khớp với con số trong câu hỏi, hãy trả lời: "Tài liệu hiện tại không đề cập cụ thể đến mức [số %] này."
        `;
        
        console.log("--> [3] Đang gọi DeepSeek-R1...");
        const response = await llm.invoke(prompt);
        answerText = response.content;
    }

    await this.saveHistory(currentConvId, userId, question, answerText, sources);

    return {
      answer: answerText,
      sources: [...new Set(validResults.map(r => r.metadata.source))].map(s => ({ source: s })),
      conversationId: currentConvId
    };
  }

  async saveHistory(convId, userId, userMsg, botMsg, sources) {
    await ChatHistory.create({ conversationId: convId, user: userId, role: 'user', content: userMsg });
    await ChatHistory.create({ conversationId: convId, user: userId, role: 'bot', content: botMsg, sources });
  }

  // --- LOGIC 2: QUẢN LÝ DỮ LIỆU ---
  
  // File lúc này là object do Multer tạo ra (có path local)
  async ingestFile(file) {
    if (!file) throw new Error("Chưa chọn file!");
    
    console.log(`--> Đang đọc file local: ${file.path}`);
    
    // 👇 SỬA LỖI: Dùng fs đọc file từ ổ cứng (Không dùng axios nữa)
    const dataBuffer = fs.readFileSync(file.path);
    const data = await pdf(dataBuffer);
    const text = data.text;
    
    if (!text || text.length < 10) throw new Error("File không có nội dung.");

    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const output = await splitter.createDocuments([text]);

    console.log(`--> Đang vector hóa ${output.length} chunks...`);

    // Xóa dữ liệu cũ
    await Document.deleteMany({ "metadata.source": file.originalname });

    // Lưu vector mới
    for (const chunk of output) {
      const vector = await this.getEmbedding(chunk.pageContent);
      await Document.create({
        content: chunk.pageContent,
        metadata: { source: file.originalname }, // path local không cần lưu vào DB cloud
        embedding: vector
      });
    }
    
    console.log("--> Hoàn tất nạp file!");
    return { message: "Nạp file thành công!", chunks: output.length };
  }

  // --- LOGIC 3: DASHBOARD HELPERS ---

  async getConversations(userId) {
    return await Conversation.find({ user: userId }).sort({ createdAt: -1 });
  }

  async getMessages(convId, userId) {
    const conv = await Conversation.findOne({ _id: convId, user: userId });
    if (!conv) throw new Error("Không có quyền truy cập");
    return await ChatHistory.find({ conversationId: convId }).sort({ createdAt: 1 });
  }

  async deleteConversation(convId, userId) {
    const conv = await Conversation.findOne({ _id: convId, user: userId });
    if (!conv) throw new Error("Không có quyền xóa");
    await ChatHistory.deleteMany({ conversationId: convId });
    await Conversation.findByIdAndDelete(convId);
    return { message: "Đã xóa hội thoại" };
  }

  // Lấy danh sách file kèm ngày giờ cho Dashboard
  async getFiles() {
    const stats = await Document.aggregate([
      { 
        $group: { 
          _id: "$metadata.source", 
          totalChunks: { $sum: 1 }, 
          uploadedAt: { $min: "$createdAt" } // Lấy ngày tạo
        } 
      },
      { $sort: { uploadedAt: -1 } }
    ]);
    return stats.map(f => ({ 
      name: f._id, 
      chunks: f.totalChunks,
      uploadedAt: f.uploadedAt 
    }));
  }

  async deleteFile(fileName) {
    const result = await Document.deleteMany({ "metadata.source": fileName });
    if (result.deletedCount === 0) throw new Error("File không tồn tại");
    return { message: `Đã xóa file ${fileName}` };
  }
}

module.exports = new RagService();