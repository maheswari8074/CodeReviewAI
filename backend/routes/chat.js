const express = require("express");
const router = express.Router();
const { sendMessage, getChatHistory } = require("../controllers/chatController");
const authMiddleware = require("../middleware/auth");
const rateLimiter = require("../middleware/rateLimiter");

router.post("/", authMiddleware, rateLimiter(20, 60000), sendMessage);
router.get("/", authMiddleware, getChatHistory);

module.exports = router;
