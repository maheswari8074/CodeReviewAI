const mongoose = require("mongoose");

const repoReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  repoUrl: { type: String, required: true },
  repoName: { type: String, required: true },
  status: { type: String, enum: ["processing", "completed", "failed"], default: "processing" },
  error: { type: String },
  avgScore: { type: Number },
  totalIssues: { type: Number },
  criticalCount: { type: Number },
  filesReviewed: { type: Number },
  files: [{
    path: { type: String },
    result: {
      overallScore: Number,
      readability: Number,
      performance: Number,
      security: Number,
      maintainability: Number,
      timeComplexity: String,
      spaceComplexity: String,
      summary: String,
      issues: [{
        severity: String,
        category: String,
        title: String,
        description: String,
        line: Number,
        suggestion: String,
      }],
      refactoring: [{
        before: String,
        after: String,
        explanation: String,
      }],
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model("RepoReview", repoReviewSchema);