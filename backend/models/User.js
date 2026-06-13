const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String },
  avatar: { type: String },
  name: { type: String },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);