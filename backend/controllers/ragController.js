const ragService = require('../services/ragService');

exports.chatWithAI = async (req, res) => {
  try {
    const { question, conversationId } = req.body;
    const userId = req.user.userId;
    const result = await ragService.chat(userId, question, conversationId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.ingestFile = async (req, res) => {
  try {
    const result = await ragService.ingestFile(req.file);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
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