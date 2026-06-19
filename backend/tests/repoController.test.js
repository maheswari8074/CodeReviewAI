/**
 * RepoReview controller unit tests
 * Tests: missing URL, ownership-scoped delete, 404 handling.
 */

jest.mock("../models/RepoReview");
jest.mock("../models/Review");
jest.mock("../services/groqService");
jest.mock("../services/githubService");
jest.mock("../queues/reviewQueue");

const RepoReview = require("../models/RepoReview");
const { submitRepoReview, deleteRepoReview, getRepoReview } = require("../controllers/repoController");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// ── submitRepoReview ──────────────────────────────────────────────────────────

describe("submitRepoReview", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns 400 when repoUrl is missing", async () => {
    const req = { body: {}, userId: "u1" };
    const res = mockRes();
    await submitRepoReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Repo URL is required" });
  });

  test("returns 500 when URL cannot be parsed", async () => {
    const req = { body: { repoUrl: "not-a-github-url" }, userId: "u1" };
    const res = mockRes();
    // parseRepoUrl will throw — the controller should catch and return 500
    const { parseRepoUrl } = require("../services/githubService");
    parseRepoUrl.mockImplementation(() => { throw new Error("Invalid GitHub URL"); });
    await submitRepoReview(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("responds immediately with repoReviewId and processing status", async () => {
    const { parseRepoUrl } = require("../services/githubService");
    parseRepoUrl.mockReturnValue({ owner: "octocat", repo: "hello-world" });
    RepoReview.create = jest.fn().mockResolvedValue({ _id: "repo1" });

    const req = { body: { repoUrl: "https://github.com/octocat/hello-world" }, userId: "u1" };
    const res = mockRes();
    await submitRepoReview(req, res);

    expect(res.json).toHaveBeenCalledWith({ repoReviewId: "repo1", status: "processing" });
  });
});

// ── deleteRepoReview ──────────────────────────────────────────────────────────

describe("deleteRepoReview", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns 400 for an invalid ObjectId", async () => {
    const req = { params: { id: "bad-id" }, userId: "u1" };
    const res = mockRes();
    await deleteRepoReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid repository review ID" });
  });

  test("returns 404 when review belongs to different user", async () => {
    RepoReview.findOneAndDelete = jest.fn().mockResolvedValue(null);
    const req = { params: { id: "507f1f77bcf86cd799439011" }, userId: "wrong-user" };
    const res = mockRes();
    await deleteRepoReview(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    // Ownership scope is enforced in the DB query
    expect(RepoReview.findOneAndDelete).toHaveBeenCalledWith({
      _id: "507f1f77bcf86cd799439011",
      userId: "wrong-user",
    });
  });

  test("returns success when review is deleted", async () => {
    RepoReview.findOneAndDelete = jest.fn().mockResolvedValue({ _id: "507f1f77bcf86cd799439011" });
    const req = { params: { id: "507f1f77bcf86cd799439011" }, userId: "u1" };
    const res = mockRes();
    await deleteRepoReview(req, res);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: "Repository review deleted" });
  });
});

// ── getRepoReview ─────────────────────────────────────────────────────────────

describe("getRepoReview", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns 404 when review not found", async () => {
    RepoReview.findOne = jest.fn().mockResolvedValue(null);
    const req = { params: { id: "507f1f77bcf86cd799439011" }, userId: "u1" };
    const res = mockRes();
    await getRepoReview(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns review when found and owned by user", async () => {
    const fakeReview = { _id: "507f1f77bcf86cd799439011", repoName: "octocat/hello-world" };
    RepoReview.findOne = jest.fn().mockResolvedValue(fakeReview);
    const req = { params: { id: "507f1f77bcf86cd799439011" }, userId: "u1" };
    const res = mockRes();
    await getRepoReview(req, res);
    expect(res.json).toHaveBeenCalledWith(fakeReview);
  });
});
