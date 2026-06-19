/**
 * Auth middleware tests
 * Tests JWT verification, missing token handling, invalid token handling.
 * No DB or network required — all dependencies mocked.
 */
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");

const SECRET = process.env.JWT_SECRET;

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("authMiddleware", () => {
  test("calls next() and sets req.userId when token is valid", () => {
    const token = jwt.sign({ userId: "user123", username: "alice" }, SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toBe("user123");
    expect(req.username).toBe("alice");
    expect(res.status).not.toHaveBeenCalled();
  });

  test("returns 401 when no Authorization header is present", () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No token provided" });
  });

  test("returns 401 when token is malformed", () => {
    const req = { headers: { authorization: "Bearer not.a.valid.token" } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
  });

  test("returns 401 when token is signed with a different secret", () => {
    const token = jwt.sign({ userId: "hacker" }, "wrong-secret");
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("returns 401 when token is expired", () => {
    const token = jwt.sign({ userId: "user123" }, SECRET, { expiresIn: -1 });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
