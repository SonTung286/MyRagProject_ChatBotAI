const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'Cuộc hội thoại mới' }, // Tên đoạn chat (ví dụ: 10 chữ đầu)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Conversation', ConversationSchema);