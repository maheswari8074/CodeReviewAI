const express = require("express");
const router = express.Router();
const { submitReview, getReviews, getReview } = require("../controllers/reviewController");
const authMiddleware = require("../middleware/auth");

router.post("/", authMiddleware, submitReview);
router.get("/", authMiddleware, getReviews);
router.get("/:id", authMiddleware, getReview);

module.exports = router;