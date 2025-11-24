const express = require("express");
const router = express.Router();
const { askChatbot, getMyChatHistory } = require("../controllers/chatbotController");
const { protectOptional } = require("../middleware/protectOptional");
const { protect } = require("../middleware/authMiddleware");

// Ask: guest hỏi được, login thì cá nhân hóa + lưu DB
router.post("/ask", protectOptional, askChatbot);

// Lịch sử: chỉ login mới xem
router.get("/history", protect, getMyChatHistory);

module.exports = router;
