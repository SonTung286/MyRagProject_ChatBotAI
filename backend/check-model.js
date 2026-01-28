// File: backend/check_models.js
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  console.log("🔑 Checking Key...");
  
  if (!key) {
      console.log("❌ LỖI: Chưa có API Key trong file .env");
      return;
  }

  const genAI = new GoogleGenerativeAI(key);

  try {
    console.log("📡 Đang kết nối server Google...");
    // Lệnh này sẽ liệt kê tất cả model mà Key của bạn được phép dùng
    const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).apiKey; // Dummy call check
    
    // Gọi hàm listModels (có trong bản mới nhất)
    // Lưu ý: Nếu thư viện quá cũ sẽ không chạy được dòng này
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();

    if (data.error) {
        console.error("❌ Google báo lỗi:", data.error.message);
        return;
    }

    console.log("\n✅ DANH SÁCH MODEL KHẢ DỤNG CHO KEY CỦA BẠN:");
    console.log("------------------------------------------------");
    
    const embeddings = data.models.filter(m => m.name.includes("embedding"));
    const chat = data.models.filter(m => m.name.includes("flash"));

    console.log("🟢 EMBEDDING MODELS (Dùng để Upload):");
    embeddings.forEach(m => console.log(`   - ${m.name.replace("models/", "")}`));

    console.log("\n🔵 CHAT MODELS (Dùng để Chat):");
    chat.forEach(m => console.log(`   - ${m.name.replace("models/", "")}`));
    
    console.log("------------------------------------------------");

  } catch (error) {
    console.error("❌ Lỗi kết nối:", error.message);
  }
}

listModels();