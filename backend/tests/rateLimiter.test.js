/**
 * Rate limiter middleware tests
 * Verifies per-user windowed limits without any network calls.
 */
const rateLimiter = require("../middleware/rateLimiter");

function mockReq(userId = "user1") {
  return { userId };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("rateLimiter", () => {
  test("allows requests under the limit", () => {
    const limit = rateLimiter(3, 60000);
    const next = jest.fn();
    const req = mockReq("userA");

    limit(req, mockRes(), next);
    limit(req, mockRes(), next);
    limit(req, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(3);
  });

  test("blocks the request that exceeds the limit", () => {
    const limit = rateLimiter(2, 60000);
    const next = jest.fn();
    const req = mockReq("userB");
    const res1 = mockRes();
    const res2 = mockRes();
    const res3 = mockRes();

    limit(req, res1, next);
    limit(req, res2, next);
    limit(req, res3, next); // should be blocked

    expect(next).toHaveBeenCalledTimes(2);
    expect(res3.status).toHaveBeenCalledWith(429);
    expect(res3.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("Too many") })
    );
  });

  test("limits are per-user — different users have independent counters", () => {
    const limit = rateLimiter(1, 60000);
    const next = jest.fn();

    limit(mockReq("userC"), mockRes(), next);
    limit(mockReq("userD"), mockRes(), next); // different user, should pass

    expect(next).toHaveBeenCalledTimes(2);
  });
});
