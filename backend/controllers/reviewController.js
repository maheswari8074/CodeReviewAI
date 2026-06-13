const Review = require("../models/Review");
const { reviewCode } = require("../services/claudeService");
const { getCachedReview, setCachedReview } = require("../services/cacheService");
const reviewQueue = require("../queues/reviewQueue");

// Submit code for review
const submitReview = async (req, res) => {
  const { code, language, filename } = req.body;

  if (!code || code.trim() === "") {
    return res.status(400).json({ message: "Code is required" });
  }

  try {
    // Check cache first
    const cached = await getCachedReview(code, language || "auto");
    if (cached) {
      console.log("Cache hit! Returning cached review.");
      const result = typeof cached === "string" ? JSON.parse(cached) : cached;

      // Save to DB even if cached
      const review = await Review.create({
        userId: req.userId,
        code,
        language: language || "auto",
        filename: filename || "",
        status: "completed",
        result,
      });

      return res.json({ reviewId: review._id, result, cached: true });
    }

    // Create review record
    const review = await Review.create({
      userId: req.userId,
      code,
      language: language || "auto",
      filename: filename || "",
      status: "processing",
    });

    // Add to queue
    const result = await reviewQueue.add({
      handler: async () => {
        const reviewResult = await reviewCode(code, language || "auto");
        await setCachedReview(code, language || "auto", reviewResult);
        return reviewResult;
      }
    });

    // Update review with result
    review.result = result;
    review.status = "completed";
    await review.save();

    res.json({ reviewId: review._id, result, cached: false });

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

// Get queue stats
const getQueueStats = async (req, res) => {
  const reviewQueue = require("../queues/reviewQueue");
  res.json(reviewQueue.getStats());
};

module.exports = { submitReview, getReviews, getReview, getQueueStats };