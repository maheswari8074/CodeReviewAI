const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const CACHE_TTL = 60 * 60; // 1 hour

// Generate cache key from code content
const getCacheKey = (code, language) => {
  const hash = Buffer.from(`${language}:${code}`).toString("base64").slice(0, 64);
  return `review:${hash}`;
};

const getCachedReview = async (code, language) => {
  try {
    const key = getCacheKey(code, language);
    const cached = await redis.get(key);
    return cached || null;
  } catch (err) {
    console.error("Cache get error:", err.message);
    return null;
  }
};

const setCachedReview = async (code, language, result) => {
  try {
    const key = getCacheKey(code, language);
    await redis.set(key, JSON.stringify(result), { ex: CACHE_TTL });
  } catch (err) {
    console.error("Cache set error:", err.message);
  }
};

module.exports = { getCachedReview, setCachedReview };