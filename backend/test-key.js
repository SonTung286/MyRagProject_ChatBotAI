// File: backend/test-key.js
require('dotenv').config(); // Load file .env
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkModels() {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  console.log("🔑 Đang kiểm tra Key:", key ? "Đã tìm thấy Key" : "KHÔNG TÌM THẤY KEY!");
  
  if (!key) return;

  const genAI = new GoogleGenerativeAI(key);

  console.log("\n📡 Đang hỏi Google danh sách Model khả dụng...");
  
  try {
    // 1. Thử EMBEDDING-004
    console.log("\n--- TEST 1: text-embedding-004 ---");
    const model4 = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const res4 = await model4.embedContent("Hello world");
    console.log("✅ 004 HOẠT ĐỘNG! Vector length:", res4.embedding.values.length);
  } catch (e) {
    console.log("❌ 004 CHẾT: ", e.message);
  }

  try {
    // 2. Thử EMBEDDING-001
    console.log("\n--- TEST 2: embedding-001 ---");
    const model1 = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const res1 = await model1.embedContent("Hello world");
    console.log("✅ 001 HOẠT ĐỘNG!");
  } catch (e) {
    console.log("❌ 001 CHẾT: ", e.message);
  }

    try {
    // 3. Thử MODEL MỚI 005
    console.log("\n--- TEST 3: text-embedding-005 ---");
    const model5 = genAI.getGenerativeModel({ model: "text-embedding-005" });
    const res5 = await model5.embedContent("Hello world");
    console.log("✅ 005 HOẠT ĐỘNG!");
  } catch (e) {
    console.log("❌ 005 CHẾT: ", e.message);
  }
}

checkModels();