const mongoose = require('mongoose');

const ChatHistorySchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }, // <--- THÊM DÒNG NÀY
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['user', 'bot'], required: true },
  content: { type: String, required: true },
  sources: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);