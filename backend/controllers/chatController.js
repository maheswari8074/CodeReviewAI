const Chat = require("../models/Chat");
const Review = require("../models/Review");
const RepoReview = require("../models/RepoReview");
const { chatCompletion } = require("../services/claudeService");

const GENERAL_SYSTEM_PROMPT =
  "You are CodeReviewAI, a helpful coding assistant. Answer questions about code quality, bugs, performance, security, refactoring, and best practices. Be concise, practical, and use code examples when helpful.";

const buildReviewContext = (review) => {
  const issues = review.result?.issues
    ?.map(
      (i) =>
        `- [${i.severity}] ${i.title}${i.line ? ` (line ${i.line})` : ""}: ${i.description}${i.suggestion ? ` Fix: ${i.suggestion}` : ""}`,
    )
    .join("\n");

  const code = review.code?.length > 8000
    ? `${review.code.slice(0, 8000)}\n... (truncated)`
    : review.code;

  return `${GENERAL_SYSTEM_PROMPT}

The user is asking about a specific code review. Use the review context below to give accurate, specific answers.

Review context:
- Filename: ${review.filename || "Untitled"}
- Language: ${review.language}
- Overall score: ${review.result?.overallScore ?? "N/A"}/100
- Readability: ${review.result?.readability ?? "N/A"}/100
- Performance: ${review.result?.performance ?? "N/A"}/100
- Security: ${review.result?.security ?? "N/A"}/100
- Maintainability: ${review.result?.maintainability ?? "N/A"}/100
- Time complexity: ${review.result?.timeComplexity || "N/A"}
- Space complexity: ${review.result?.spaceComplexity || "N/A"}
- Summary: ${review.result?.summary || "N/A"}

Issues found:
${issues || "None"}

Reviewed code:
\`\`\`${review.language}
${code}
\`\`\``;
};

const buildRepoContext = (repoReview) => {
  const fileSummaries = repoReview.files
    ?.map((f) => {
      const score = f.result?.overallScore ?? "N/A";
      const issueCount = f.result?.issues?.length ?? 0;
      const topIssues = f.result?.issues
        ?.slice(0, 3)
        .map((i) => `${i.severity}: ${i.title}`)
        .join("; ");
      return `- ${f.path} (score ${score}/100, ${issueCount} issues${topIssues ? ` — ${topIssues}` : ""})`;
    })
    .join("\n");

  return `${GENERAL_SYSTEM_PROMPT}

The user is asking about a repository review. Use the repo context below.

Repository context:
- Repo: ${repoReview.repoName}
- URL: ${repoReview.repoUrl}
- Average score: ${repoReview.avgScore ?? "N/A"}/100
- Files reviewed: ${repoReview.filesReviewed ?? 0}
- Total issues: ${repoReview.totalIssues ?? 0}
- Critical issues: ${repoReview.criticalCount ?? 0}

Files:
${fileSummaries || "None"}`;
};

const getChatQuery = (userId, reviewId, repoReviewId) => {
  if (reviewId) return { userId, reviewId };
  if (repoReviewId) return { userId, repoReviewId };
  return { userId, reviewId: null, repoReviewId: null };
};

const getSystemPrompt = async (userId, reviewId, repoReviewId) => {
  if (reviewId) {
    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) throw new Error("NOT_FOUND");
    return buildReviewContext(review);
  }

  if (repoReviewId) {
    const repoReview = await RepoReview.findOne({ _id: repoReviewId, userId });
    if (!repoReview) throw new Error("NOT_FOUND");
    return buildRepoContext(repoReview);
  }

  return GENERAL_SYSTEM_PROMPT;
};

const sendMessage = async (req, res) => {
  const { message, reviewId, repoReviewId } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ message: "Message is required" });
  }

  try {
    const systemPrompt = await getSystemPrompt(req.userId, reviewId, repoReviewId);
    const query = getChatQuery(req.userId, reviewId || null, repoReviewId || null);

    let chat = await Chat.findOne(query);
    if (!chat) {
      chat = new Chat({
        userId: req.userId,
        reviewId: reviewId || null,
        repoReviewId: repoReviewId || null,
        messages: [],
      });
    }

    chat.messages.push({ role: "user", content: message.trim() });

    const aiMessages = chat.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const reply = await chatCompletion(aiMessages, systemPrompt);
    chat.messages.push({ role: "assistant", content: reply });
    await chat.save();

    res.json({ reply, messages: chat.messages });
  } catch (err) {
    if (err.message === "NOT_FOUND") {
      return res.status(404).json({ message: "Review context not found" });
    }
    console.error("Chat error:", err.message);
    res.status(500).json({ message: "Failed to send message" });
  }
};

const getChatHistory = async (req, res) => {
  const { reviewId, repoReviewId } = req.query;

  try {
    if (reviewId) {
      const review = await Review.findOne({ _id: reviewId, userId: req.userId });
      if (!review) return res.status(404).json({ message: "Review not found" });
    }

    if (repoReviewId) {
      const repoReview = await RepoReview.findOne({ _id: repoReviewId, userId: req.userId });
      if (!repoReview) return res.status(404).json({ message: "Repo review not found" });
    }

    const query = getChatQuery(req.userId, reviewId || null, repoReviewId || null);
    const chat = await Chat.findOne(query);

    res.json({ messages: chat?.messages || [] });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { sendMessage, getChatHistory };
