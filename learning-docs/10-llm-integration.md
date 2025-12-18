# 10 - LLM Integration (OpenAI API)

## Overview

PRISM uses OpenAI's GPT-4 for:
- **Deep code analysis** - Finding vulnerabilities beyond patterns
- **Documentation generation** - Creating JSDoc and READMEs
- **RAG chat** - Answering questions about codebases

---

## LLM Analyzer

**File:** `backend/src/services/llmAnalyzer.js`

### analyzeWithLLM()

Uses GPT-4 to find security and quality issues.

```javascript
async function analyzeWithLLM(code, language, apiKey) {
  // 1. Create the system prompt (instructions for GPT-4)
  const systemPrompt = `You are an expert code security reviewer.
Analyze the code and return a JSON array of issues.

For each issue, include:
- id: unique string
- type: "security" | "quality" | "performance"
- severity: "critical" | "high" | "moderate" | "low"
- title: short issue title
- line: line number
- description: detailed explanation
- fix: how to fix it

Return ONLY valid JSON array.`;

  // 2. Create user prompt with the code
  const userPrompt = `Analyze this ${language} code:
\`\`\`${language}
${code}
\`\`\``;

  // 3. Call OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',  // Cost-effective, fast
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1  // Low = more consistent output
    })
  });

  // 4. Parse the JSON response
  const data = await response.json();
  const content = data.choices[0].message.content;

  // Handle markdown code blocks in response
  let jsonStr = content;
  const match = content.match(/```json?\s*([\s\S]*?)```/);
  if (match) jsonStr = match[1];

  return JSON.parse(jsonStr);
}
```

### generateDocsWithLLM()

Creates documentation from code.

```javascript
async function generateDocsWithLLM(code, language, apiKey) {
  const prompt = `Generate documentation for this ${language} code.

Return JSON with:
- "jsdoc": JSDoc comments as a string
- "readme": README markdown as a string

Code:
\`\`\`${language}
${code}
\`\`\``;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    // ... same pattern
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

---

## OpenAI API Basics

### The Request

```javascript
fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sk-your-api-key'  // Your API key
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',       // Which model to use
    messages: [                  // The conversation
      { role: 'system', content: '...' },  // Instructions
      { role: 'user', content: '...' }     // User's question
    ],
    temperature: 0.1,            // 0=deterministic, 1=creative
    max_tokens: 2000             // Response length limit
  })
});
```

### The Response

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "GPT-4's response text here"
      }
    }
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 300,
    "total_tokens": 450
  }
}
```

---

## Message Roles

| Role | Purpose |
|------|---------|
| `system` | Instructions for how GPT should behave |
| `user` | The question or input from the user |
| `assistant` | GPT's response (used for conversation history) |

---

## Temperature Setting

| Value | Behavior |
|-------|----------|
| 0.0 | Deterministic, same answer every time |
| 0.1-0.3 | Consistent but slight variation |
| 0.5-0.7 | Balanced creativity |
| 1.0 | Very creative, unpredictable |

For code analysis, we use **0.1-0.2** for consistent results.

---

## Error Handling

```javascript
if (!response.ok) {
  const error = await response.json();

  if (response.status === 401) {
    throw new Error('Invalid API key');
  }

  if (response.status === 429) {
    throw new Error('Rate limit exceeded');
  }

  throw new Error(error.error?.message || 'API error');
}
```

---

## Getting JSON from GPT

GPT often wraps JSON in markdown code blocks:

```
Here's the analysis:
\`\`\`json
[{"id": "1", "severity": "high"}]
\`\`\`
```

We extract it:

```javascript
const content = data.choices[0].message.content;

// Look for ```json ... ``` blocks
const match = content.match(/```json?\s*([\s\S]*?)```/);
if (match) {
  const json = JSON.parse(match[1]);
}
```

---

## Next: [Docker & DevOps](./11-docker.md)
