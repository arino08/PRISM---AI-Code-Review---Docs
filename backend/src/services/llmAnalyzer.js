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

Return a JSON object with:
- jsdoc: JSDoc/docstring comments for all functions and classes
- readme: A README section documenting the module's purpose, usage, and API

Code:
\`\`\`${language}
${code}
\`\`\`

Return only valid JSON with "jsdoc" and "readme" keys.`;

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

    return JSON.parse(jsonStr.trim());

  } catch (error) {
    console.error('LLM docs generation failed:', error);
    throw error;
  }
}

module.exports = { analyzeWithLLM, generateDocsWithLLM };
