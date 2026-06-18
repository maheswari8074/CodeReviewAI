const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review", default: null },
  repoReviewId: { type: mongoose.Schema.Types.ObjectId, ref: "RepoReview", default: null },
  messages: [{
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

chatSchema.index({ userId: 1, reviewId: 1 });
chatSchema.index({ userId: 1, repoReviewId: 1 });
chatSchema.index({ userId: 1, reviewId: 1, repoReviewId: 1 });

module.exports = mongoose.model("Chat", chatSchema);
