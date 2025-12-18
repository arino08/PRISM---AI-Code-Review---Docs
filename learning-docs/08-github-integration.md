# 08 - GitHub Integration

## Overview

PRISM can analyze entire GitHub repositories or specific Pull Requests by:
1. Parsing GitHub URLs
2. Fetching file trees and contents via the GitHub API
3. Running security analysis on each file

---

## GitHub Service

**File:** `backend/src/services/githubService.js`

### Key Functions

#### 1. parseGitHubUrl()

Extracts owner and repo from various URL formats:

```javascript
function parseGitHubUrl(url) {
  // Handles:
  // - https://github.com/facebook/react
  // - facebook/react (shorthand)

  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/|$)/,
    /^([^\/]+)\/([^\/]+)$/  // owner/repo format
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  }

  throw new Error('Invalid GitHub URL format');
}

// Example:
parseGitHubUrl('https://github.com/facebook/react')
// → { owner: 'facebook', repo: 'react' }
```

#### 2. getRepoTree()

Fetches the entire file structure of a repository:

```javascript
async function getRepoTree(owner, repo, branch = 'main', token = null) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'CodeReview-AI'
  };

  // Add auth token if provided (for private repos)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Fetch tree from GitHub API
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers }
  );

  const data = await response.json();

  // Filter to only code files
  const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', ...];
  const ignorePaths = ['node_modules', 'dist', 'build', '.git'];

  const files = data.tree
    .filter(item => item.type === 'blob')  // Files only, not folders
    .filter(item => codeExtensions.some(ext => item.path.endsWith(ext)))
    .filter(item => !ignorePaths.some(ignore => item.path.includes(ignore)));

  return { files, totalFiles: files.length };
}
```

#### 3. getFileContent()

Fetches a single file's content:

```javascript
async function getFileContent(owner, repo, path, ref = 'main', token = null) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
    {
      headers: {
        'Accept': 'application/vnd.github.v3.raw'  // Get raw content
      }
    }
  );

  return response.text();  // Return as string
}
```

#### 4. getMultipleFiles()

Fetches multiple files in batches (to avoid rate limits):

```javascript
async function getMultipleFiles(owner, repo, paths, ref, token) {
  const results = [];
  const batchSize = 10;  // 10 files at a time

  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);

    // Fetch batch in parallel
    const batchResults = await Promise.all(
      batch.map(path => getFileContent(owner, repo, path, ref, token))
    );

    results.push(...batchResults);

    // Wait 100ms between batches (rate limiting)
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}
```

#### 5. getPullRequestDiff()

Fetches PR details and changed files:

```javascript
async function getPullRequestDiff(owner, repo, prNumber, token) {
  // Get PR metadata
  const pr = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`
  ).then(r => r.json());

  // Get changed files
  const files = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`
  ).then(r => r.json());

  return {
    number: pr.number,
    title: pr.title,
    author: pr.user.login,
    additions: pr.additions,
    deletions: pr.deletions,
    files: files.map(f => ({
      filename: f.filename,
      status: f.status,  // added, modified, deleted
      patch: f.patch     // The diff
    }))
  };
}
```

---

## How Repository Analysis Works

In `index.js`:

```javascript
app.post('/api/github/analyze-repo', async (req, res) => {
  const { url, token, maxFiles = 30, mode, openaiKey } = req.body;

  // 1. Parse the URL
  const { owner, repo } = parseGitHubUrl(url);

  // 2. Get file tree
  const tree = await getRepoTree(owner, repo, 'main', token);

  // 3. Limit files to analyze
  const filesToAnalyze = tree.files.slice(0, maxFiles);

  // 4. Fetch file contents
  const fileContents = await getMultipleFiles(
    owner, repo,
    filesToAnalyze.map(f => f.path),
    tree.branch, token
  );

  // 5. Analyze each file
  const allIssues = [];
  for (const { path, content } of fileContents) {
    const issues = await analyzeCode(content);
    allIssues.push(...issues.map(i => ({ ...i, file: path })));
  }

  // 6. Return results
  res.json({
    repository: `${owner}/${repo}`,
    filesAnalyzed: filesToAnalyze.length,
    issues: allIssues
  });
});
```

---

## GitHub API Rate Limits

- **Unauthenticated:** 60 requests/hour
- **With token:** 5,000 requests/hour

That's why we accept an optional `token` parameter for private repos and higher limits.

---

## Next: [RAG Chat System](./09-rag-chat.md)
