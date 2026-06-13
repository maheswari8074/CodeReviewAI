const Review = require("../models/Review");
const { reviewCode } = require("../services/claudeService");

// Submit code for review
const submitReview = async (req, res) => {
  const { code, language, filename } = req.body;

  if (!code || code.trim() === "") {
    return res.status(400).json({ message: "Code is required" });
  }

  try {
    // Create review record
    const review = await Review.create({
      userId: req.userId,
      code,
      language: language || "auto",
      filename: filename || "",
      status: "processing",
    });

    // Call Claude API
    const result = await reviewCode(code, language || "auto");

    // Update review with result
    review.result = result;
    review.status = "completed";
    await review.save();

    res.json({ reviewId: review._id, result });

  } catch (err) {
    console.error("Review error:", err.message);
    res.status(500).json({ message: "Review failed", error: err.message });
  }
};

// Get all reviews for a user
const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.userId })
      .select("-code -result.refactoring")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single review
const getReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!review) return res.status(404).json({ message: "Review not found" });

    res.json(review);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { submitReview, getReviews, getReview };