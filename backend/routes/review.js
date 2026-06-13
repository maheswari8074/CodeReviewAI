const express = require("express");
const router = express.Router();
const { submitReview, getReviews, getReview, getQueueStats } = require("../controllers/reviewController");
const authMiddleware = require("../middleware/auth");
const rateLimiter = require("../middleware/rateLimiter");

router.post("/", authMiddleware, rateLimiter(10, 60000), submitReview);
router.get("/", authMiddleware, getReviews);
router.get("/queue/stats", authMiddleware, getQueueStats);
router.get("/:id", authMiddleware, getReview);

module.exports = router;