const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  content: { 
    type: String, 
    required: true 
  }, // Nội dung đoạn văn bản
  metadata: { 
    source: String, // Tên file nguồn (ví dụ: Quy_che.pdf)
  }, 
  embedding: {
    type: [Number], // Mảng số thực (Vector) - QUAN TRỌNG
    required: true,
    index: 'vector' // Bắt buộc phải có index này (bạn vừa tạo trên web)
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', DocumentSchema);