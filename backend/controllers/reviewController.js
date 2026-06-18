const Review = require("../models/Review");
const mongoose = require("mongoose");
const { reviewCode } = require("../services/claudeService");
const { getCachedReview, setCachedReview } = require("../services/cacheService");
const reviewQueue = require("../queues/reviewQueue");

const processReview = async (reviewId, code, language) => {
  try {
    const result = await reviewQueue.add({
      handler: async () => {
        const reviewResult = await reviewCode(code, language);
        await setCachedReview(code, language, reviewResult);
        return reviewResult;
      },
    });

    await Review.findByIdAndUpdate(reviewId, { result, status: "completed" });
  } catch (err) {
    console.error("Background review error:", err.message);
    await Review.findByIdAndUpdate(reviewId, {
      status: "failed",
      error: err.message,
    });
  }
};

const submitReview = async (req, res) => {
  const { code, language, filename } = req.body;

  if (!code || code.trim() === "") {
    return res.status(400).json({ message: "Code is required" });
  }

  try {
    const lang = language || "auto";
    const cached = await getCachedReview(code, lang);

    if (cached) {
      const result = typeof cached === "string" ? JSON.parse(cached) : cached;
      const review = await Review.create({
        userId: req.userId,
        code,
        language: lang,
        filename: filename || "",
        status: "completed",
        result,
      });

      return res.json({ reviewId: review._id, status: "completed", result, cached: true });
    }

    const review = await Review.create({
      userId: req.userId,
      code,
      language: lang,
      filename: filename || "",
      status: "processing",
    });

    res.json({ reviewId: review._id, status: "processing", cached: false });

    processReview(review._id, code, lang);
  } catch (err) {
    console.error("Review error:", err.message);
    res.status(500).json({ message: "Review failed", error: err.message });
  }
};

const getReviewSummary = async (userId) => {
  const oid = new mongoose.Types.ObjectId(userId);
  const [stats, latest] = await Promise.all([
    Review.aggregate([
      { $match: { userId: oid, status: "completed", "result.overallScore": { $exists: true } } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$result.overallScore" },
          total: { $sum: 1 },
        },
      },
    ]),
    Review.findOne({ userId, status: "completed" })
      .sort({ createdAt: -1 })
      .select("result.overallScore"),
  ]);

  return {
    totalReviews: stats[0]?.total || 0,
    avgScore: stats[0]?.avgScore ? Math.round(stats[0].avgScore) : null,
    latestScore: latest?.result?.overallScore ?? null,
  };
};

const getReviews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { userId: req.userId };

    const [reviews, total, summary] = await Promise.all([
      Review.find(filter)
        .select("-code -result.refactoring")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
      getReviewSummary(req.userId),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      summary,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

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

const getReviewStatus = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).select("status error result.overallScore");

    if (!review) return res.status(404).json({ message: "Review not found" });

    res.json({
      reviewId: review._id,
      status: review.status,
      error: review.error,
      overallScore: review.result?.overallScore ?? null,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const getQueueStats = async (req, res) => {
  res.json(reviewQueue.getStats());
};

module.exports = {
  submitReview,
  getReviews,
  getReview,
  getReviewStatus,
  getQueueStats,
};
