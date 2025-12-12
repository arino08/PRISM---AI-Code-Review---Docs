/**
 * Security Analyzer - Detects security vulnerabilities in code
 */

const SECURITY_PATTERNS = {
  // ---------------------------------------------------------
  // 1. INJECTION VULNERABILITIES (SQL, Command, NoSQL, LDAP)
  // ---------------------------------------------------------
  injection: [
    // SQL Injection
    {
      pattern: /`\s*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\b.*\$\{/gi,
      title: 'SQL Injection (Template Literal)',
      description: 'Template literal with variable interpolation in SQL query. Attackers can inject malicious SQL through user input.',
      fix: "Use parameterized queries instead of string interpolation.",
      severity: 'critical',
      references: ['https://owasp.org/www-community/attacks/SQL_Injection']
    },
    {
      pattern: /\$\{[^}]+\}.*?(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)/gi,
      title: 'SQL Injection (String Interpolation)',
      description: 'Direct string interpolation in SQL query allows attackers to manipulate database queries.',
      fix: "Use parameterized queries: db.query('SELECT * FROM users WHERE email = ?', [email])",
      severity: 'critical',
      references: ['https://owasp.org/www-community/attacks/SQL_Injection']
    },
    {
      pattern: /(?:exec|execute|query|raw)\s*\(\s*['"`].*\$\{/gi,
      title: 'Potential SQL Injection',
      description: 'Executing raw SQL with template literals is dangerous.',
      fix: 'Use an ORM or parameterized queries.',
      severity: 'critical'
    },
    {
      pattern: /['"`]\s*\+\s*\w+\s*\+\s*['"`].*(?:SELECT|INSERT|UPDATE|DELETE)/gi,
      title: 'SQL Injection (Concatenation)',
      description: 'String concatenation in SQL query enables injection.',
      fix: "Use parameterized queries with placeholders.",
      severity: 'critical'
    },
    // Command Injection
    {
      pattern: /(?:child_process|cp)\.exec\s*\(\s*['"`].*\$\{/gi,
      title: 'Command Injection (Node.js)',
      description: 'Passing unsanitized user input to exec() allows arbitrary command execution.',
      fix: 'Use execFile or spawn with argument arrays, which do not spawn a shell.',
      severity: 'critical',
      references: ['https://owasp.org/www-community/attacks/Command_Injection']
    },
    {
      pattern: /(?:os\.system|subprocess\.call|subprocess\.Popen)\s*\(/gi,
      title: 'Command Injection (Python)',
      description: 'Executing shell commands with user input is dangerous.',
      fix: 'Use subprocess.run with shell=False and pass args as a list.',
      severity: 'critical'
    },
    // NoSQL Injection
    {
      pattern: /\$where\s*:\s*['"`].*['"`]/gi,
      title: 'NoSQL Injection ($where)',
      description: 'MongoDB $where operator allows JavaScript execution, leading to NoSQL injection and DoS.',
      fix: 'Avoid $where. Use standard query operators.',
      severity: 'high'
    }
  ],

  // ---------------------------------------------------------
  // 2. CRYPTOGRAPHIC FAILURES
  // ---------------------------------------------------------
  crypto: [
    {
      pattern: /crypto\.createHash\s*\(\s*['"`](?:md5|sha1)['"`]\s*\)/gi,
      title: 'Weak Hashing Algorithm',
      description: 'MD5 and SHA1 are collision-prone and insecure for critical data.',
      fix: "Use SHA-256 or stronger: crypto.createHash('sha256')",
      severity: 'medium',
      references: ['https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html']
    },
    {
      pattern: /AES\.new\s*\([^,]+,\s*AES\.MODE_ECB/gi,
      title: 'Insecure Encryption Mode (ECB)',
      description: 'AES in ECB mode does not hide data patterns and is not semantically secure.',
      fix: 'Use GCM or CBC mode with a random IV.',
      severity: 'high'
    },
    {
      pattern: /Math\.random\(\)/gi,
      title: 'Weak Random Number Generator',
      description: 'Math.random() is not ensuring the randomness required for security contexts (tokens, keys).',
      fix: 'Use crypto.getRandomValues() or crypto.randomBytes() for security-critical randomness.',
      severity: 'low'
    }
  ],

  // ---------------------------------------------------------
  // 3. HARDCODED SECRETS (Extensive)
  // ---------------------------------------------------------
  secrets: [
    {
      pattern: /(?:password|passwd|pwd|secret|token|api[_-]?key|auth[_-]?token)\s*[:=]\s*['"`][^'"`]{3,}['"`]/gi,
      title: 'Generic Hardcoded Secret',
      description: 'Detected a potential hardcoded password, API key, or token.',
      fix: 'Store secrets in environment variables.',
      severity: 'critical'
    },
    // AWS
    {
      pattern: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g,
      title: 'AWS Access Key ID',
      description: 'AWS Access Key detected. If exposed, attackers can access your AWS resources.',
      fix: 'Revoke immediately and use IAM roles or env vars.',
      severity: 'critical'
    },
    // Google
    {
      pattern: /AIza[0-9A-Za-z\\-_]{35}/g,
      title: 'Google API Key',
      description: 'Google Cloud API Key detected.',
      fix: 'Restrict key scope and move to environment variables.',
      severity: 'high'
    },
    // Private Keys
    {
      pattern: /-----BEGIN\s+(?:RSA|DSA|EC|PGP|OPENSSH)?\s+PRIVATE\s+KEY-----/g,
      title: 'Private Encryption Key',
      description: 'Private key found in source code. This compromises your entire trust chain.',
      fix: 'Remove key file from repo, rotate key, and load from secure storage.',
      severity: 'critical'
    },
    // Slack
    {
      pattern: /xox[baprs]-([0-9a-zA-Z]{10,48})/g,
      title: 'Slack Token',
      description: 'Slack API Token detected.',
      fix: 'Revoke token and use OAuth or env vars.',
      severity: 'critical'
    },
    // Stripe
    {
      pattern: /(?:sk|pk)_(?:test|live)_[0-9a-zA-Z]{10,}/g,
      title: 'Stripe API Key',
      description: 'Stripe Secret/Publishable Key detected.',
      fix: 'Move to environment variables.',
      severity: 'critical'
    },
    // Generic API Key (High Entropy)
    {
      pattern: /["']?[0-9a-fA-F]{32,64}["']?/g, // Matches 32-64 hex chars (common for API keys/hashes)
      title: 'High Entropy String (Potential Key)',
      description: 'Looks like an API Key, Hash, or Token.',
      fix: 'Verify if this is a secret and move to env vars.',
      severity: 'medium'
    }
  ],

  // ---------------------------------------------------------
  // 4. XSS & CLIENT-SIDE RISKS
  // ---------------------------------------------------------
  xss: [
    {
      pattern: /\.innerHTML\s*=(?!.*(?:DOMPurify|sanitize|escape))/gi,
      title: 'XSS (innerHTML)',
      description: 'Unsanitized innerHTML allows script injection.',
      fix: 'Use textContent or DOMPurify.sanitize().',
      severity: 'high'
    },
    {
      pattern: /dangerouslySetInnerHTML/g,
      title: 'React Dangerous HTML',
      description: 'Reacts replacement for innerHTML. Use only with trusted content.',
      fix: 'Sanitize content before passing to this prop.',
      severity: 'medium'
    },
    {
      pattern: /document\.write\s*\(/gi,
      title: 'Obsolete document.write',
      description: 'Can lead to XSS and performance issues.',
      fix: 'Use modern DOM manipulation.',
      severity: 'high'
    }
  ],

  // ---------------------------------------------------------
  // 5. MISCONFIGURATION & BAD PRACTICES
  // ---------------------------------------------------------
  config: [
    {
      pattern: /(?:debug|verbose)\s*[:=]\s*true/gi,
      title: 'Debug Mode Enabled',
      description: 'Debug mode may expose sensitive info in stacks or logs.',
      fix: 'Ensure debug is false in production.',
      severity: 'low'
    },
    {
      pattern: /disable_web_page_preview/g,
      title: 'Telegram Bot Config',
      description: 'Check if disabling web previews is intended.',
      fix: 'Review configuration.',
      severity: 'info'
    },
    {
      pattern: /eval\s*\(/gi,
      title: 'Code Injection via eval()',
      description: 'Dangerous function that executes arbitrary code.',
      fix: 'Remove eval().',
      severity: 'critical'
    }
  ]
};

async function analyzeCode(code, language = 'javascript') {
  const issues = [];
  const lines = code.split('\n');
  let issueId = 0;

  // Check each category of security patterns
  for (const [category, patterns] of Object.entries(SECURITY_PATTERNS)) {
    for (const { pattern, title, description, fix, severity, references } of patterns) {
      // Reset regex state
      pattern.lastIndex = 0;

      // Search line by line to get accurate line numbers
      lines.forEach((line, index) => {
        // Reset regex for each line
        const linePattern = new RegExp(pattern.source, pattern.flags);
        if (linePattern.test(line)) {
          issues.push({
            id: `security-${issueId++}`,
            type: 'security',
            category,
            severity,
            title,
            line: index + 1,
            description,
            code: line.trim(),
            fix,
            references: references || []
          });
        }
      });
    }
  }

  return issues;
}

module.exports = { analyzeCode };
