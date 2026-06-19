// Set test env vars before any module loads
process.env.JWT_SECRET = "test-secret-key-for-jest";
process.env.GROQ_API_KEY = "test-key";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
// Prevent Upstash Redis from complaining about missing env vars
process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
