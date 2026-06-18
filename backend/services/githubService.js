const axios = require("axios");

const GITHUB_API = "https://api.github.com";

// Extract owner/repo from URL
const parseRepoUrl = (url) => {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) throw new Error("Invalid GitHub URL");
  return { owner: match[1], repo: match[2].replace(".git", "") };
};

// Get repo file tree
const getRepoTree = async (owner, repo, token) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Get default branch
  const repoInfo = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}`, { headers });
  const defaultBranch = repoInfo.data.default_branch;

  // Get tree recursively
  const treeRes = await axios.get(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
    { headers }
  );

  return treeRes.data.tree;
};

// Filter to only relevant code files
const CODE_EXTENSIONS = [
  ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".cpp", ".c", ".cs",
  ".go", ".rs", ".rb", ".php", ".swift", ".kt", ".html", ".css",
  ".scss", ".vue", ".svelte", ".sql", ".sh"
];
const IGNORE_PATTERNS = ["node_modules", ".git", "dist", "build", "vendor", "__pycache__", ".next"];

const filterCodeFiles = (tree, maxFiles = 8) => {
  return tree
    .filter(item => item.type === "blob")
    .filter(item => CODE_EXTENSIONS.some(ext => item.path.endsWith(ext)))
    .filter(item => !IGNORE_PATTERNS.some(pattern => item.path.includes(pattern)))
    .filter(item => item.size && item.size < 30000) // skip huge files
    .slice(0, maxFiles);
};

// Get file content
const getFileContent = async (owner, repo, path, token) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.get(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
    { headers }
  );
  return Buffer.from(res.data.content, "base64").toString("utf-8");
};

module.exports = { parseRepoUrl, getRepoTree, filterCodeFiles, getFileContent };