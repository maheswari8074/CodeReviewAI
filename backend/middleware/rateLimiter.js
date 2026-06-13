const requestCounts = new Map();

const rateLimiter = (maxRequests = 10, windowMs = 60000) => {
  return (req, res, next) => {
    const key = req.userId || req.ip;
    const now = Date.now();

    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const userData = requestCounts.get(key);

    if (now > userData.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userData.count >= maxRequests) {
      return res.status(429).json({
        message: `Too many requests. Please wait ${Math.ceil((userData.resetTime - now) / 1000)} seconds.`
      });
    }

    userData.count++;
    next();
  };
};

module.exports = rateLimiter;