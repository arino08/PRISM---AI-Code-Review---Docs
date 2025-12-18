# 07 - Code Analysis (How Vulnerability Scanning Works)

## Overview

PRISM scans code for security issues using **pattern matching** - looking for known bad patterns in code.

---

## Security Analyzer

**File:** `backend/src/services/analyzers/securityAnalyzer.js`

### The Pattern System

We define patterns as **Regular Expressions** (regex) that match vulnerable code:

```javascript
const SECURITY_PATTERNS = {
  // Category of issues
  injection: [
    {
      pattern: /`\s*(?:SELECT|INSERT|UPDATE|DELETE).*\$\{/gi,
      title: 'SQL Injection (Template Literal)',
      description: 'Template literal with variable in SQL query...',
      fix: "Use parameterized queries instead.",
      severity: 'critical',
      references: ['https://owasp.org/...']
    },
    // ... more patterns
  ],

  crypto: [...],
  secrets: [...],
  xss: [...],
  config: [...]
};
```

### How analyzeCode() Works

```javascript
async function analyzeCode(code, language = 'javascript') {
  const issues = [];
  const lines = code.split('\n');  // Split into lines
  let issueId = 0;

  // For each category (injection, crypto, etc.)
  for (const [category, patterns] of Object.entries(SECURITY_PATTERNS)) {

    // For each pattern in that category
    for (const { pattern, title, description, fix, severity } of patterns) {

      // Check each line
      lines.forEach((line, index) => {
        if (pattern.test(line)) {  // Does this line match the pattern?
          issues.push({
            id: `security-${issueId++}`,
            type: 'security',
            category,
            severity,
            title,
            line: index + 1,  // Line number (1-indexed)
            description,
            code: line.trim(),
            fix,
          });
        }
      });
    }
  }

  return issues;
}
```

---

## Categories of Issues

### 1. Injection Vulnerabilities

**SQL Injection:**
```javascript
// ❌ BAD - User input directly in query
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ GOOD - Parameterized query
const query = 'SELECT * FROM users WHERE email = ?';
db.query(query, [email]);
```

**Command Injection:**
```javascript
// ❌ BAD - User input in shell command
exec(`ls ${userInput}`);

// ✅ GOOD - Use array of arguments
execFile('ls', [userInput]);
```

### 2. Cryptographic Issues

```javascript
// ❌ BAD - Weak hash algorithm
crypto.createHash('md5');

// ✅ GOOD - Strong algorithm
crypto.createHash('sha256');

// ❌ BAD - Predictable random
Math.random();

// ✅ GOOD - Cryptographic random
crypto.randomBytes(32);
```

### 3. Hardcoded Secrets

The analyzer detects patterns like:
- `password = "secret123"`
- `AKIA...` (AWS keys)
- `sk_live_...` (Stripe keys)
- `-----BEGIN PRIVATE KEY-----`

### 4. XSS (Cross-Site Scripting)

```javascript
// ❌ BAD - Can inject scripts
element.innerHTML = userInput;

// ✅ GOOD - Escapes HTML
element.textContent = userInput;
```

---

## Regular Expression Explained

Let's break down a complex pattern:

```javascript
/`\s*(?:SELECT|INSERT|UPDATE|DELETE)\b.*\$\{/gi
```

| Part | Meaning |
|------|---------|
| `/` | Start of regex |
| `` ` `` | Match backtick (template literal start) |
| `\s*` | Match zero or more whitespace |
| `(?:...)` | Non-capturing group |
| `SELECT\|INSERT\|...` | Match any of these SQL keywords |
| `\b` | Word boundary |
| `.*` | Match anything |
| `\$\{` | Match `${` (variable interpolation) |
| `/gi` | Flags: global, case-insensitive |

---

## Quality Analyzer

**File:** `backend/src/services/analyzers/qualityAnalyzer.js`

Similar to security analyzer but focuses on code quality:
- Unused variables
- Complex functions
- Missing error handling
- Console.log statements
- Magic numbers

---

## Severity Levels

| Level | Meaning | Example |
|-------|---------|---------|
| `critical` | Immediate security risk | SQL injection, hardcoded AWS key |
| `high` | Serious vulnerability | XSS, weak encryption |
| `medium` | Should fix | Weak hashing for non-sensitive data |
| `low` | Best practice | Debug mode on, Math.random() |
| `info` | Just informational | Config notes |

---

## Next: [GitHub Integration](./08-github-integration.md)
