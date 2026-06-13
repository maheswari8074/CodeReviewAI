const axios = require("axios");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Step 1: Redirect to GitHub
const githubLogin = (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user:email`;
  res.redirect(githubAuthUrl);
};

// Step 2: GitHub calls back with a code
const githubCallback = async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenResponse.data.access_token;

    // Get user info from GitHub
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const githubUser = userResponse.data;

    // Get user email
    const emailResponse = await axios.get("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const primaryEmail = emailResponse.data.find((e) => e.primary)?.email;

    // Upsert user in DB
    let user = await User.findOne({ githubId: githubUser.id });

    if (!user) {
      user = await User.create({
        githubId: githubUser.id,
        username: githubUser.login,
        email: primaryEmail,
        avatar: githubUser.avatar_url,
        name: githubUser.name,
      });
    } else {
      user.avatar = githubUser.avatar_url;
      user.name = githubUser.name;
      await user.save();
    }

    // Create JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);

  } catch (err) {
    console.error("GitHub OAuth error:", err.message);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-__v");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { githubLogin, githubCallback, getMe };