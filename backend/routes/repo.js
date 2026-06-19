const express = require("express");
const router = express.Router();
const { submitRepoReview, getRepoReview, getRepoReviews, getRepoReviewStatus, deleteRepoReview } = require("../controllers/repoController");
const authMiddleware = require("../middleware/auth");
const rateLimiter = require("../middleware/rateLimiter");

router.post("/", authMiddleware, rateLimiter(5, 60000), submitRepoReview);
router.get("/", authMiddleware, getRepoReviews);
router.get("/:id/status", authMiddleware, getRepoReviewStatus);
router.get("/:id", authMiddleware, getRepoReview);
router.delete("/:id", authMiddleware, deleteRepoReview);

module.exports = router;