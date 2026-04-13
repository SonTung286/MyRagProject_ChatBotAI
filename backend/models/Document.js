const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  content: { 
    type: String, 
    required: true 
  },
  metadata: {
    source: { type: String, required: true }, // Tên file
    // 👇 QUAN TRỌNG: Bỏ 'required: true' hoặc xóa dòng cloudLink đi
    cloudLink: { type: String }, 
    page: { type: Number }
  },
  embedding: { 
    type: [Number], 
    required: true,
    index: 'vector' // Index cho Atlas Search
  },
  // Thêm trường này để biết file nạp lúc nào (phục vụ Dashboard)
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Document', DocumentSchema);