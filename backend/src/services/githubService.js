/**
 * GitHub Service - Fetch repositories, files, and PR diffs
 */

const GITHUB_API = 'https://api.github.com';

/**
 * Parse GitHub URL to extract owner and repo
 */
function parseGitHubUrl(url) {
  // Handle various GitHub URL formats
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/|$)/,
    /^([^\/]+)\/([^\/]+)$/  // owner/repo format
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2].replace('.git', '') };
    }
  }

  throw new Error('Invalid GitHub URL format. Use: owner/repo or https://github.com/owner/repo');
}

/**
 * Fetch repository file tree
 */
async function getRepoTree(owner, repo, branch = 'main', token = null) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'CodeReview-AI'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Try main, then master
  let branchToUse = branch;
  let response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branchToUse}?recursive=1`,
    { headers }
  );

  if (!response.ok && branch === 'main') {
    branchToUse = 'master';
    response = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branchToUse}?recursive=1`,
      { headers }
    );
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch repository');
  }

  const data = await response.json();

  // Filter to only code files
  const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.rb', '.php', '.c', '.cpp', '.h', '.cs'];
  const ignorePaths = ['node_modules', 'vendor', 'dist', 'build', '.git', '__pycache__', '.next'];

  const files = data.tree
    .filter(item => item.type === 'blob')
    .filter(item => codeExtensions.some(ext => item.path.endsWith(ext)))
    .filter(item => !ignorePaths.some(ignore => item.path.includes(ignore)))
    .map(item => ({
      path: item.path,
      sha: item.sha,
      size: item.size,
      url: item.url
    }));

  return { files, branch: branchToUse, totalFiles: files.length };
}

/**
 * Fetch file content from GitHub
 */
async function getFileContent(owner, repo, path, ref = 'main', token = null) {
  const headers = {
    'Accept': 'application/vnd.github.v3.raw',
    'User-Agent': 'CodeReview-AI'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${path}`);
  }

  return response.text();
}

/**
 * Fetch multiple files in parallel with rate limiting
 */
async function getMultipleFiles(owner, repo, paths, ref = 'main', token = null) {
  const results = [];
  const batchSize = 10; // Fetch 10 files at a time

  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (path) => {
        try {
          const content = await getFileContent(owner, repo, path, ref, token);
          return { path, content, error: null };
        } catch (error) {
          return { path, content: null, error: error.message };
        }
      })
    );
    results.push(...batchResults);

    // Rate limit: wait 100ms between batches
    if (i + batchSize < paths.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Fetch PR diff from GitHub
 */
async function getPullRequestDiff(owner, repo, prNumber, token = null) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'CodeReview-AI'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Get PR details
  const prResponse = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}`,
    { headers }
  );

  if (!prResponse.ok) {
    throw new Error('Failed to fetch pull request');
  }

  const pr = await prResponse.json();

  // Get PR files (changed files)
  const filesResponse = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/files`,
    { headers }
  );

  if (!filesResponse.ok) {
    throw new Error('Failed to fetch pull request files');
  }

  const files = await filesResponse.json();

  return {
    number: pr.number,
    title: pr.title,
    description: pr.body,
    state: pr.state,
    author: pr.user.login,
    baseBranch: pr.base.ref,
    headBranch: pr.head.ref,
    additions: pr.additions,
    deletions: pr.deletions,
    changedFiles: pr.changed_files,
    files: files.map(f => ({
      filename: f.filename,
      status: f.status, // added, removed, modified, renamed
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch, // The actual diff
      previousFilename: f.previous_filename // For renames
    }))
  };
}

/**
 * Parse a GitHub PR URL to extract owner, repo, and PR number
 */
function parsePRUrl(url) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
  if (match) {
    return { owner: match[1], repo: match[2], prNumber: parseInt(match[3]) };
  }
  throw new Error('Invalid PR URL. Use format: https://github.com/owner/repo/pull/123');
}

/**
 * Get repository info
 */
async function getRepoInfo(owner, repo, token = null) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'CodeReview-AI'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}`,
    { headers }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch repository info');
  }

  const data = await response.json();

  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    language: data.language,
    defaultBranch: data.default_branch,
    stars: data.stargazers_count,
    forks: data.forks_count,
    isPrivate: data.private,
    owner: data.owner.login,
    url: data.html_url
  };
}

module.exports = {
  parseGitHubUrl,
  parsePRUrl,
  getRepoInfo,
  getRepoTree,
  getFileContent,
  getMultipleFiles,
  getPullRequestDiff
};
