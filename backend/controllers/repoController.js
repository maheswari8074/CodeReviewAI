const Review = require("../models/Review");
const RepoReview = require("../models/RepoReview");
const { reviewCode } = require("../services/claudeService");
const { parseRepoUrl, getRepoTree, filterCodeFiles, getFileContent } = require("../services/githubService");
const reviewQueue = require("../queues/reviewQueue");

const submitRepoReview = async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ message: "Repo URL is required" });
  }

  try {
    const { owner, repo } = parseRepoUrl(repoUrl);

    // Create initial record
    const repoReview = await RepoReview.create({
      userId: req.userId,
      repoUrl,
      repoName: `${owner}/${repo}`,
      status: "processing",
    });

    // Respond immediately with ID, process in background
    res.json({ repoReviewId: repoReview._id, status: "processing" });

    // Process in background (don't await before responding)
    processRepoReview(repoReview._id, owner, repo);

  } catch (err) {
    console.error("Repo review error:", err.message);
    res.status(500).json({ message: "Failed to start repo review", error: err.message });
  }
};

const processRepoReview = async (repoReviewId, owner, repo) => {
  try {
    const tree = await getRepoTree(owner, repo, null);
    const files = filterCodeFiles(tree, 8);

    if (files.length === 0) {
      await RepoReview.findByIdAndUpdate(repoReviewId, {
        status: "failed",
        error: "No reviewable code files found in this repo",
      });
      return;
    }

    const fileResults = [];

    for (const file of files) {
      try {
        const content = await getFileContent(owner, repo, file.path, null);
        const ext = file.path.split(".").pop();

        const result = await reviewQueue.add({
          handler: () => reviewCode(content, ext),
        });

        fileResults.push({
          path: file.path,
          result,
        });
      } catch (err) {
        console.error(`Failed to review ${file.path}:`, err.message);
      }
    }

    // Calculate aggregate score
    const validResults = fileResults.filter(f => f.result?.overallScore);
    const avgScore = validResults.length
      ? Math.round(validResults.reduce((acc, f) => acc + f.result.overallScore, 0) / validResults.length)
      : 0;

    const totalIssues = validResults.reduce((acc, f) => acc + (f.result.issues?.length || 0), 0);
    const criticalCount = validResults.reduce(
      (acc, f) => acc + (f.result.issues?.filter(i => i.severity === "critical").length || 0), 0
    );

    await RepoReview.findByIdAndUpdate(repoReviewId, {
      status: "completed",
      files: fileResults,
      avgScore,
      totalIssues,
      criticalCount,
      filesReviewed: validResults.length,
    });

  } catch (err) {
    console.error("Background repo processing error:", err.message);
    await RepoReview.findByIdAndUpdate(repoReviewId, {
      status: "failed",
      error: err.message,
    });
  }
};

const getRepoReview = async (req, res) => {
  try {
    const repoReview = await RepoReview.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!repoReview) return res.status(404).json({ message: "Repo review not found" });

    res.json(repoReview);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const getRepoReviews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const filter = { userId: req.userId };

    const [repoReviews, total] = await Promise.all([
      RepoReview.find(filter)
        .select("-files")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      RepoReview.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      data: repoReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const getRepoReviewStatus = async (req, res) => {
  try {
    const repoReview = await RepoReview.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).select("status error avgScore filesReviewed totalIssues criticalCount repoName");

    if (!repoReview) return res.status(404).json({ message: "Repo review not found" });

    res.json({
      repoReviewId: repoReview._id,
      status: repoReview.status,
      error: repoReview.error,
      avgScore: repoReview.avgScore ?? null,
      filesReviewed: repoReview.filesReviewed ?? 0,
      totalIssues: repoReview.totalIssues ?? 0,
      criticalCount: repoReview.criticalCount ?? 0,
      repoName: repoReview.repoName,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { submitRepoReview, getRepoReview, getRepoReviews, getRepoReviewStatus };