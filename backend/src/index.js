const express = require('express');
const cors = require('cors');
const { analyzeCode } = require('./services/analyzers/securityAnalyzer');
const { analyzeQuality } = require('./services/analyzers/qualityAnalyzer');
const { analyzePerformance } = require('./services/analyzers/performanceAnalyzer');
const { generateDocumentation } = require('./services/documentationGenerator');
const { analyzeWithLLM, generateDocsWithLLM } = require('./services/llmAnalyzer');
const {
  parseGitHubUrl,
  parsePRUrl,
  getRepoInfo,
  getRepoTree,
  getFileContent,
  getMultipleFiles,
  getPullRequestDiff
} = require('./services/githubService');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware - CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Analyze code for security and quality issues
// Supports two modes: 'pattern' (default, free) or 'llm' (requires openaiKey)
app.post('/api/analyze', async (req, res) => {
  try {
    const { code, language = 'javascript', mode = 'pattern', openaiKey } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    let allIssues = [];

    if (mode === 'llm') {
      // LLM-powered deep analysis
      if (!openaiKey) {
        return res.status(400).json({
          error: 'OpenAI API key required for LLM mode',
          hint: 'Provide openaiKey in request body or use mode: "pattern" for free analysis'
        });
      }

      allIssues = await analyzeWithLLM(code, language, openaiKey);
    } else {
      // Pattern-based analysis (free)
      const [securityIssues, qualityIssues, performanceIssues] = await Promise.all([
        analyzeCode(code, language),
        analyzeQuality(code, language),
        analyzePerformance(code, language),
      ]);
      allIssues = [...securityIssues, ...qualityIssues, ...performanceIssues];
    }
    const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
    allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    res.json({
      issues: allIssues,
      summary: {
        total: allIssues.length,
        critical: allIssues.filter(i => i.severity === 'critical').length,
        high: allIssues.filter(i => i.severity === 'high').length,
        moderate: allIssues.filter(i => i.severity === 'moderate').length,
        low: allIssues.filter(i => i.severity === 'low').length,
      }
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed', message: error.message });
  }
});

// Generate documentation
// Supports 'pattern' or 'llm' mode
app.post('/api/generate-docs', async (req, res) => {
  try {
    const { code, language = 'javascript', mode = 'pattern', openaiKey } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    if (mode === 'llm') {
      if (!openaiKey) {
        return res.status(400).json({ error: 'OpenAI API key required for LLM documentation' });
      }
      const documentation = await generateDocsWithLLM(code, language, openaiKey);
      res.json(documentation);
    } else {
      const documentation = await generateDocumentation(code, language);
      res.json(documentation);
    }
  } catch (error) {
    console.error('Documentation generation error:', error);
    res.status(500).json({ error: 'Documentation generation failed', message: error.message });
  }
});

// ============= GitHub Integration Routes =============

// Get repository info and file tree
app.post('/api/github/repo', async (req, res) => {
  try {
    const { url, token } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    const { owner, repo } = parseGitHubUrl(url);
    const [repoInfo, tree] = await Promise.all([
      getRepoInfo(owner, repo, token),
      getRepoTree(owner, repo, 'main', token)
    ]);

    res.json({
      ...repoInfo,
      files: tree.files,
      branch: tree.branch,
      totalFiles: tree.totalFiles
    });
  } catch (error) {
    console.error('GitHub repo error:', error);
    res.status(500).json({ error: 'Failed to fetch repository', message: error.message });
  }
});

// Analyze entire repository
app.post('/api/github/analyze-repo', async (req, res) => {
  try {
    const { url, token, maxFiles = 50, mode = 'pattern', openaiKey } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    const { owner, repo } = parseGitHubUrl(url);
    const tree = await getRepoTree(owner, repo, 'main', token);

    // Limit files to analyze (prioritize by common important files)
    const priorityPatterns = [
      /^src\//, /^app\//, /^lib\//, /^api\//, /^routes\//, /^controllers\//,
      /^services\//, /^utils\//, /^helpers\//, /^middleware\//
    ];

    const sortedFiles = tree.files.sort((a, b) => {
      const aHasPriority = priorityPatterns.some(p => p.test(a.path));
      const bHasPriority = priorityPatterns.some(p => p.test(b.path));
      if (aHasPriority && !bHasPriority) return -1;
      if (!aHasPriority && bHasPriority) return 1;
      return a.size - b.size; // Smaller files first
    });

    const filesToAnalyze = sortedFiles.slice(0, maxFiles);
    const filePaths = filesToAnalyze.map(f => f.path);

    // Fetch file contents
    const fileContents = await getMultipleFiles(owner, repo, filePaths, tree.branch, token);

    // Analyze each file
    const allIssues = [];
    const fileResults = [];

    for (const file of fileContents) {
      if (file.content) {
        const language = getLanguageFromPath(file.path);

      let issues = [];
      if (mode === 'llm' && openaiKey) {
        try {
          // Use LLM for analysis
          issues = await analyzeWithLLM(file.content, language, openaiKey);
        } catch (e) {
          console.error(`LLM error for ${file.path}:`, e.message);
          // Fallback to pattern matching if LLM fails
          const [security, quality, performance] = await Promise.all([
            analyzeCode(file.content, language),
            analyzeQuality(file.content, language),
            analyzePerformance(file.content, language)
          ]);
          issues = [...security, ...quality, ...performance];
        }
      } else {
        // Use Pattern Matching
        const [security, quality, performance] = await Promise.all([
          analyzeCode(file.content, language),
          analyzeQuality(file.content, language),
          analyzePerformance(file.content, language)
        ]);
        issues = [...security, ...quality, ...performance];
      }

      const fileIssues = issues.map(issue => ({
        ...issue,
        file: file.path
      }));

        allIssues.push(...fileIssues);
        fileResults.push({
          path: file.path,
          language,
          issueCount: fileIssues.length,
          issues: fileIssues
        });
      }
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
    allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    res.json({
      repository: `${owner}/${repo}`,
      filesAnalyzed: fileContents.filter(f => f.content).length,
      totalFilesInRepo: tree.totalFiles,
      issues: allIssues,
      fileResults,
      summary: {
        total: allIssues.length,
        critical: allIssues.filter(i => i.severity === 'critical').length,
        high: allIssues.filter(i => i.severity === 'high').length,
        moderate: allIssues.filter(i => i.severity === 'moderate').length,
        low: allIssues.filter(i => i.severity === 'low').length,
      }
    });
  } catch (error) {
    console.error('Repo analysis error:', error);
    res.status(500).json({ error: 'Repository analysis failed', message: error.message });
  }
});

// Analyze Pull Request
app.post('/api/github/analyze-pr', async (req, res) => {
  try {
    const { url, token, mode = 'pattern', openaiKey } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Pull Request URL is required' });
    }

    const { owner, repo, prNumber } = parsePRUrl(url);
    const pr = await getPullRequestDiff(owner, repo, prNumber, token);

    // Analyze each changed file
    const fileAnalysis = [];
    const allIssues = [];

    for (const file of pr.files) {
      if (file.patch && file.status !== 'removed') {
        // Extract only the added lines from the patch
        const addedLines = extractAddedLines(file.patch);

        if (addedLines.code) {
          const language = getLanguageFromPath(file.filename);
          let issues = [];

          if (mode === 'llm' && openaiKey) {
            try {
              issues = await analyzeWithLLM(addedLines.code, language, openaiKey);
            } catch (e) {
               console.error(`LLM error for PR file ${file.filename}:`, e.message);
               // Fallback
               const [security, quality, performance] = await Promise.all([
                analyzeCode(addedLines.code, language),
                analyzeQuality(addedLines.code, language),
                analyzePerformance(addedLines.code, language)
              ]);
              issues = [...security, ...quality, ...performance];
            }
          } else {
            const [security, quality, performance] = await Promise.all([
              analyzeCode(addedLines.code, language),
              analyzeQuality(addedLines.code, language),
              analyzePerformance(addedLines.code, language)
            ]);
            issues = [...security, ...quality, ...performance];
          }

          // Adjust line numbers to match PR diff
          const fileIssues = issues.map(issue => ({
            ...issue,
            file: file.filename,
            prLine: mapToOriginalLine(issue.line, addedLines.lineMap),
            isNewCode: true
          }));

          allIssues.push(...fileIssues);
          fileAnalysis.push({
            filename: file.filename,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions,
            issues: fileIssues
          });
        }
      }
    }

    const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
    allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    res.json({
      pr: {
        number: pr.number,
        title: pr.title,
        author: pr.author,
        baseBranch: pr.baseBranch,
        headBranch: pr.headBranch,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changedFiles
      },
      issues: allIssues,
      fileAnalysis,
      summary: {
        total: allIssues.length,
        critical: allIssues.filter(i => i.severity === 'critical').length,
        high: allIssues.filter(i => i.severity === 'high').length,
        moderate: allIssues.filter(i => i.severity === 'moderate').length,
        low: allIssues.filter(i => i.severity === 'low').length,
      }
    });
  } catch (error) {
    console.error('PR analysis error:', error);
    res.status(500).json({ error: 'PR analysis failed', message: error.message });
  }
});

// Analyze PR and post comments directly to GitHub
app.post('/api/github/review-pr', async (req, res) => {
  try {
    const { url, token } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Pull Request URL is required' });
    }

    if (!token) {
      return res.status(400).json({ error: 'GitHub token is required to post comments' });
    }

    const { owner, repo, prNumber } = parsePRUrl(url);
    const pr = await getPullRequestDiff(owner, repo, prNumber, token);

    // Analyze each changed file
    const allIssues = [];

    for (const file of pr.files) {
      if (file.patch && file.status !== 'removed') {
        const addedLines = extractAddedLines(file.patch);

        if (addedLines.code) {
          const language = getLanguageFromPath(file.filename);
          const [security, quality, performance] = await Promise.all([
            analyzeCode(addedLines.code, language),
            analyzeQuality(addedLines.code, language),
            analyzePerformance(addedLines.code, language)
          ]);

          const fileIssues = [...security, ...quality, ...performance]
            .filter(issue => ['critical', 'high', 'moderate'].includes(issue.severity))
            .map(issue => ({
              ...issue,
              path: file.filename,
              line: issue.line || 1,
            }));

          allIssues.push(...fileIssues);
        }
      }
    }

    // Post review to GitHub
    const GITHUB_API = 'https://api.github.com';
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'CodeReview-AI'
    };

    if (allIssues.length > 0) {
      // Create review with inline comments
      const comments = allIssues.slice(0, 30).map(issue => ({
        path: issue.path,
        line: issue.line,
        body: `⚠️ **${issue.title}** (\`${issue.severity}\`)\n\n${issue.description}\n\n💡 **Fix:** ${issue.fix}`
      }));

      const reviewResponse = await fetch(
        `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            event: 'COMMENT',
            body: `## 🔍 AI Code Review\n\nFound **${allIssues.length}** issue(s) in this PR.\n\n| Severity | Count |\n|----------|-------|\n| 🔴 Critical | ${allIssues.filter(i => i.severity === 'critical').length} |\n| 🟠 High | ${allIssues.filter(i => i.severity === 'high').length} |\n| 🟡 Moderate | ${allIssues.filter(i => i.severity === 'moderate').length} |`,
            comments
          })
        }
      );

      if (!reviewResponse.ok) {
        const error = await reviewResponse.json();
        throw new Error(error.message || 'Failed to post review');
      }

      res.json({
        success: true,
        message: `Posted ${comments.length} review comments to PR #${prNumber}`,
        issuesFound: allIssues.length,
        commentsPosted: comments.length
      });
    } else {
      // Post approval comment
      const commentResponse = await fetch(
        `${GITHUB_API}/repos/${owner}/${repo}/issues/${prNumber}/comments`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            body: '✅ **AI Code Review:** No significant issues found! This PR is looking good. 🎉'
          })
        }
      );

      if (!commentResponse.ok) {
        const error = await commentResponse.json();
        throw new Error(error.message || 'Failed to post comment');
      }

      res.json({
        success: true,
        message: `No issues found in PR #${prNumber}. Posted approval comment.`,
        issuesFound: 0,
        commentsPosted: 1
      });
    }
  } catch (error) {
    console.error('PR review error:', error);
    res.status(500).json({ error: 'Failed to post PR review', message: error.message });
  }
});

// Helper: Get language from file path
function getLanguageFromPath(path) {
  const ext = path.split('.').pop().toLowerCase();
  const langMap = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'go': 'go',
    'rs': 'rust',
    'rb': 'ruby',
    'php': 'php',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'cs': 'csharp'
  };
  return langMap[ext] || 'javascript';
}

// Helper: Extract only added lines from a git patch
function extractAddedLines(patch) {
  const lines = patch.split('\n');
  const addedLines = [];
  const lineMap = {}; // Maps our line number to the PR line number
  let patchLineNum = 0;
  let ourLineNum = 0;

  for (const line of lines) {
    patchLineNum++;

    // Skip diff headers
    if (line.startsWith('@@')) {
      continue;
    }

    // Only include added lines (starting with +, but not +++)
    if (line.startsWith('+') && !line.startsWith('+++')) {
      ourLineNum++;
      addedLines.push(line.substring(1)); // Remove the + prefix
      lineMap[ourLineNum] = patchLineNum;
    }
  }

  return {
    code: addedLines.join('\n'),
    lineMap
  };
}

// Helper: Map our line number back to PR line
function mapToOriginalLine(ourLine, lineMap) {
  return lineMap[ourLine] || ourLine;
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CodeReview AI Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🐙 GitHub integration enabled`);
});
