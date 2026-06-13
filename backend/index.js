const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));

// Connect DB
connectDB();

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/reviews", require("./routes/review"));
// Health check
app.get("/", (req, res) => {
  res.json({ message: "CodeReviewAI backend is running 🚀" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});