const express = require('express');
const router = express.Router();
const { askChatbot } = require('../controllers/chatbotController');

// === PUBLIC ROUTE ===
// Khách vãng lai + Cư dân đều có thể hỏi chatbot
router.post('/ask', askChatbot);

module.exports = router;
