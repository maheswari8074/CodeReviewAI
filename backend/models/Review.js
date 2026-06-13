const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  code: { type: String, required: true },
  language: { type: String, default: "auto" },
  filename: { type: String, default: "" },
  status: { type: String, enum: ["pending", "processing", "completed", "failed"], default: "pending" },
  result: {
    overallScore: { type: Number },
    readability: { type: Number },
    performance: { type: Number },
    security: { type: Number },
    maintainability: { type: Number },
    timeComplexity: { type: String },
    spaceComplexity: { type: String },
    issues: [{
      severity: { type: String, enum: ["critical", "warning", "suggestion"] },
      category: { type: String },
      title: { type: String },
      description: { type: String },
      line: { type: Number },
      suggestion: { type: String }
    }],
    refactoring: [{
      before: { type: String },
      after: { type: String },
      explanation: { type: String }
    }],
    summary: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);