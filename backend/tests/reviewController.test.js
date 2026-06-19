/**
 * Review controller unit tests
 * Mocks: mongoose Review model, cacheService, reviewQueue, claudeService.
 * Tests: submit validation, cache hit path, delete ownership, getReviews pagination/filter.
 */

jest.mock("../models/Review");
jest.mock("../services/cacheService");
jest.mock("../queues/reviewQueue");
jest.mock("../services/groqService");

const Review = require("../models/Review");
const { getCachedReview } = require("../services/cacheService");
const reviewQueue = require("../queues/reviewQueue");
const { submitReview, deleteReview, getReview, getReviews } = require("../controllers/reviewController");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// ── submitReview ──────────────────────────────────────────────────────────────

describe("submitReview", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns 400 when code is missing", async () => {
    const req = { body: { code: "" }, userId: "u1" };
    const res = mockRes();
    await submitReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Code is required" });
  });

  test("returns 400 when code is only whitespace", async () => {
    const req = { body: { code: "   " }, userId: "u1" };
    const res = mockRes();
    await submitReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns cached result immediately when cache hits", async () => {
    const cachedResult = { overallScore: 88 };
    getCachedReview.mockResolvedValue(cachedResult);
    Review.create = jest.fn().mockResolvedValue({ _id: "rev1", result: cachedResult });

    const req = { body: { code: "console.log(1)", language: "javascript" }, userId: "u1" };
    const res = mockRes();
    await submitReview(req, res);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed", cached: true })
    );
    expect(reviewQueue.add).not.toHaveBeenCalled();
  });

  test("creates a processing review and starts queue job when no cache", async () => {
    getCachedReview.mockResolvedValue(null);
    reviewQueue.add = jest.fn().mockResolvedValue({ overallScore: 72 });
    Review.create = jest.fn().mockResolvedValue({ _id: "rev2" });
    Review.findByIdAndUpdate = jest.fn().mockResolvedValue({});

    const req = { body: { code: "def foo(): pass", language: "python", filename: "foo.py" }, userId: "u1" };
    const res = mockRes();
    await submitReview(req, res);

    expect(Review.create).toHaveBeenCalledWith(expect.objectContaining({ status: "processing", language: "python" }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "processing", cached: false }));
  });
});

// ── deleteReview ──────────────────────────────────────────────────────────────

describe("deleteReview", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns 400 for an invalid ObjectId", async () => {
    const req = { params: { id: "not-an-id" }, userId: "u1" };
    const res = mockRes();
    await deleteReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid review ID" });
  });

  test("returns 404 when review does not belong to user", async () => {
    Review.findOneAndDelete = jest.fn().mockResolvedValue(null);
    // Use a valid-looking ObjectId
    const req = { params: { id: "507f1f77bcf86cd799439011" }, userId: "other-user" };
    const res = mockRes();
    await deleteReview(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(Review.findOneAndDelete).toHaveBeenCalledWith({
      _id: "507f1f77bcf86cd799439011",
      userId: "other-user",
    });
  });

  test("returns success when review is deleted", async () => {
    Review.findOneAndDelete = jest.fn().mockResolvedValue({ _id: "507f1f77bcf86cd799439011" });
    const req = { params: { id: "507f1f77bcf86cd799439011" }, userId: "u1" };
    const res = mockRes();
    await deleteReview(req, res);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: "Review deleted" });
  });
});

// ── getReview ─────────────────────────────────────────────────────────────────

describe("getReview", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns 404 when review not found or owned by different user", async () => {
    Review.findOne = jest.fn().mockResolvedValue(null);
    const req = { params: { id: "507f1f77bcf86cd799439011" }, userId: "u1" };
    const res = mockRes();
    await getReview(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns review data when found", async () => {
    const fakeReview = { _id: "507f1f77bcf86cd799439011", code: "x=1", userId: "u1" };
    Review.findOne = jest.fn().mockResolvedValue(fakeReview);
    const req = { params: { id: "507f1f77bcf86cd799439011" }, userId: "u1" };
    const res = mockRes();
    await getReview(req, res);
    expect(res.json).toHaveBeenCalledWith(fakeReview);
  });
});

// ── getReviews pagination / filter ───────────────────────────────────────────

describe("getReviews", () => {
  beforeEach(() => jest.clearAllMocks());

  const makeChain = (value) => ({
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(value),
  });

  const mockSummary = () => {
    // getReviewSummary uses aggregate + findOne with sort/select chain
    Review.aggregate = jest.fn().mockResolvedValue([{ _id: null, avgScore: 80, total: 5 }]);
    const findOneChain = { sort: jest.fn().mockReturnThis(), select: jest.fn().mockResolvedValue({ result: { overallScore: 85 } }) };
    // findOne is called twice: once inside getReviews filter and once in getReviewSummary
    // We need it to work for both — use mockImplementation to return the chain always
    Review.findOne = jest.fn().mockReturnValue(findOneChain);
  };

  test("defaults to page 1 and returns pagination metadata", async () => {
    Review.find = jest.fn().mockReturnValue(makeChain([]));
    Review.countDocuments = jest.fn().mockResolvedValue(0);
    mockSummary();

    // must be a valid 24-char hex string for mongoose.Types.ObjectId
    const req = { query: {}, userId: "507f1f77bcf86cd799439011" };
    const res = mockRes();
    await getReviews(req, res);

    const call = res.json.mock.calls[0][0];
    expect(call).toHaveProperty("pagination");
    expect(call.pagination.page).toBe(1);
    expect(call).toHaveProperty("data");
  });

  test("applies status filter to DB query", async () => {
    Review.find = jest.fn().mockReturnValue(makeChain([]));
    Review.countDocuments = jest.fn().mockResolvedValue(0);
    mockSummary();

    const req = { query: { status: "completed" }, userId: "507f1f77bcf86cd799439011" };
    const res = mockRes();
    await getReviews(req, res);

    const filterArg = Review.find.mock.calls[0][0];
    expect(filterArg.status).toBe("completed");
  });

  test("ignores invalid status values", async () => {
    Review.find = jest.fn().mockReturnValue(makeChain([]));
    Review.countDocuments = jest.fn().mockResolvedValue(0);
    mockSummary();

    const req = { query: { status: "'; DROP TABLE reviews;--" }, userId: "507f1f77bcf86cd799439011" };
    const res = mockRes();
    await getReviews(req, res);

    const filterArg = Review.find.mock.calls[0][0];
    expect(filterArg.status).toBeUndefined();
  });
});
