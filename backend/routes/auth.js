const express = require("express");
const router = express.Router();
const { githubLogin, githubCallback, getMe } = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

router.get("/github", githubLogin);
router.get("/github/callback", githubCallback);
router.get("/me", authMiddleware, getMe);

module.exports = router;