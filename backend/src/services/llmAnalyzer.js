/**
 * LLM Analyzer - Uses OpenAI for deep code analysis
 * Users provide their own API key
 */

async function analyzeWithLLM(code, language, apiKey) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required for LLM analysis');
  }

  const systemPrompt = `You are an expert code security and quality reviewer. Analyze the provided code and return a JSON array of issues found.

For each issue, include:
- id: unique string (e.g., "llm-1")
- type: "security" | "quality" | "performance"
- severity: "critical" | "high" | "moderate" | "low"
- title: short issue title
- line: line number where issue occurs (estimate if unclear)
- description: detailed explanation of the vulnerability/issue
- code: the problematic code snippet
- fix: specific suggestion to fix the issue

Focus on:
1. Security: SQL injection, XSS, hardcoded secrets, auth issues, SSRF, path traversal
2. Quality: error handling, complexity, code smells, anti-patterns
3. Performance: N+1 queries, memory leaks, blocking operations

Return ONLY valid JSON array. If no issues found, return empty array [].`;

  const userPrompt = `Analyze this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Return JSON array of issues:`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost-effective, fast
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1, // Low temperature for consistent results
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key');
      }
      if (response.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again later.');
      }
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const issues = JSON.parse(jsonStr.trim());

    // Validate and normalize issues
    return issues.map((issue, idx) => ({
      id: issue.id || `llm-${idx}`,
      type: issue.type || 'quality',
      severity: ['critical', 'high', 'moderate', 'low'].includes(issue.severity)
        ? issue.severity
        : 'moderate',
      title: issue.title || 'Issue found',
      line: issue.line || 1,
      description: issue.description || '',
      code: issue.code || '',
      fix: issue.fix || '',
      source: 'llm' // Mark as LLM-generated
    }));

  } catch (error) {
    if (error.message.includes('JSON')) {
      console.error('Failed to parse LLM response:', error);
      return []; // Return empty if parsing fails
    }
    throw error;
  }
}

/**
 * Generate documentation using LLM
 */
async function generateDocsWithLLM(code, language, apiKey) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required for LLM documentation');
  }

  const prompt = `Generate comprehensive documentation for this ${language} code.

Return a JSON object with exactly two keys:
- "jsdoc": A single STRING containing JSDoc/docstring comments for all functions and classes (the actual comment text, not an object)
- "readme": A single STRING containing a README in markdown format documenting the module's purpose, usage, and API

IMPORTANT: Both values must be strings, NOT nested objects.

Code:
\`\`\`${language}
${code}
\`\`\`

Return only valid JSON with "jsdoc" and "readme" as string values.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';

    // Parse JSON
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());

    // Check if response has jsdoc/readme keys or is a function-keyed object
    if (parsed.jsdoc !== undefined || parsed.readme !== undefined) {
      return {
        jsdoc: typeof parsed.jsdoc === 'string' ? parsed.jsdoc : convertToJSDoc(parsed.jsdoc),
        readme: typeof parsed.readme === 'string' ? parsed.readme : convertToReadme(parsed.readme)
      };
    } else {
      // LLM returned function-keyed object directly - convert it
      return {
        jsdoc: convertToJSDoc(parsed),
        readme: convertToReadme(parsed)
      };
    }

  } catch (error) {
    console.error('LLM docs generation failed:', error);
    throw error;
  }
}

/**
 * Convert structured object to JSDoc format
 */
function convertToJSDoc(obj) {
  if (!obj || typeof obj !== 'object') return '';

  let jsdoc = '';

  for (const [name, info] of Object.entries(obj)) {
    jsdoc += '/**\n';
    jsdoc += ` * ${info.description || name}\n`;
    jsdoc += ' *\n';

    // Handle params
    const params = info.params || (info.constructor?.params) || [];
    if (Array.isArray(params)) {
      params.forEach(p => {
        jsdoc += ` * @param {${p.type || 'any'}} ${p.name} - ${p.description || ''}\n`;
      });
    }

    // Handle returns
    if (info.returns) {
      jsdoc += ` * @returns {${info.returns.type || 'any'}} ${info.returns.description || ''}\n`;
    }

    // Handle throws
    if (info.throws) {
      jsdoc += ` * @throws {${info.throws.type || 'Error'}} ${info.throws.description || ''}\n`;
    }

    // Handle methods for classes
    if (info.methods) {
      jsdoc += ' *\n';
      for (const [methodName, methodInfo] of Object.entries(info.methods)) {
        jsdoc += ` * @method ${methodName} - ${methodInfo.description || ''}\n`;
      }
    }

    jsdoc += ' */\n\n';
  }

  return jsdoc.trim();
}

/**
 * Convert structured object to README markdown
 */
function convertToReadme(obj) {
  if (!obj || typeof obj !== 'object') return '';

  let readme = '# API Reference\n\n';

  for (const [name, info] of Object.entries(obj)) {
    const isClass = info.constructor || info.methods;

    readme += `## ${isClass ? 'Class: ' : ''}${name}\n\n`;
    readme += `${info.description || ''}\n\n`;

    // Handle params
    const params = info.params || (info.constructor?.params) || [];
    if (Array.isArray(params) && params.length > 0) {
      readme += '### Parameters\n\n';
      readme += '| Name | Type | Description |\n';
      readme += '|------|------|-------------|\n';
      params.forEach(p => {
        readme += `| \`${p.name}\` | \`${p.type || 'any'}\` | ${p.description || ''} |\n`;
      });
      readme += '\n';
    }

    // Handle returns
    if (info.returns) {
      readme += `**Returns:** \`${info.returns.type || 'any'}\` - ${info.returns.description || ''}\n\n`;
    }

    // Handle methods
    if (info.methods) {
      readme += '### Methods\n\n';
      for (const [methodName, methodInfo] of Object.entries(info.methods)) {
        readme += `#### \`${methodName}()\`\n\n`;
        readme += `${methodInfo.description || ''}\n\n`;
        if (methodInfo.params?.length) {
          methodInfo.params.forEach(p => {
            readme += `- **${p.name}** (\`${p.type || 'any'}\`): ${p.description || ''}\n`;
          });
          readme += '\n';
        }
        if (methodInfo.returns) {
          readme += `**Returns:** \`${methodInfo.returns.type}\` - ${methodInfo.returns.description || ''}\n\n`;
        }
      }
    }

    readme += '---\n\n';
  }

  return readme.trim();
}

/**
 * Generate an intelligent PR summary using LLM
 * Analyzes the diff and provides a concise description of changes
 */
async function generatePRSummary(prData, filesWithDiffs, apiKey) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required for PR summary generation');
  }

  // Build context from PR data and diffs
  const changesContext = filesWithDiffs.map(file => {
    return `### ${file.filename} (${file.status})
+${file.additions} -${file.deletions}
${file.patch ? file.patch.substring(0, 1500) : 'No diff available'}`;
  }).join('\n\n');

  const prompt = `You are a senior software engineer reviewing a Pull Request. Analyze the changes and provide a comprehensive but concise summary.

## PR Information
- **Title**: ${prData.title || 'Untitled'}
- **Author**: ${prData.author}
- **Base Branch**: ${prData.baseBranch} ← ${prData.headBranch}
- **Files Changed**: ${prData.changedFiles}
- **Lines**: +${prData.additions} -${prData.deletions}

## Changes
${changesContext}

---

Provide a JSON response with EXACTLY this structure:
{
  "summary": "A 2-3 sentence summary of what this PR does",
  "keyChanges": ["Change 1", "Change 2", "Change 3"],
  "category": "feature|bugfix|refactor|docs|test|chore|security",
  "impact": "low|medium|high",
  "securityNotes": "Any security concerns or null if none",
  "breakingChanges": true|false,
  "reviewFocus": ["Area 1 to pay attention to", "Area 2"]
}

Return ONLY valid JSON.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';

    // Parse JSON
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());

    return {
      summary: parsed.summary || 'Unable to generate summary',
      keyChanges: parsed.keyChanges || [],
      category: parsed.category || 'chore',
      impact: parsed.impact || 'medium',
      securityNotes: parsed.securityNotes || null,
      breakingChanges: parsed.breakingChanges || false,
      reviewFocus: parsed.reviewFocus || []
    };

  } catch (error) {
    console.error('PR summary generation failed:', error);
    // Return a basic summary on failure
    return {
      summary: `This PR modifies ${prData.changedFiles} file(s) with ${prData.additions} additions and ${prData.deletions} deletions.`,
      keyChanges: filesWithDiffs.map(f => `${f.status}: ${f.filename}`).slice(0, 5),
      category: 'chore',
      impact: 'medium',
      securityNotes: null,
      breakingChanges: false,
      reviewFocus: []
    };
  }
}

module.exports = { analyzeWithLLM, generateDocsWithLLM, generatePRSummary };
