/**
 * Security Analyzer - Detects security vulnerabilities in code
 * Supports: JavaScript, TypeScript, Python, Go, Java, Rust, PHP
 */

const SECURITY_PATTERNS = {
  // ---------------------------------------------------------
  // 1. INJECTION VULNERABILITIES (SQL, Command, NoSQL, LDAP)
  // ---------------------------------------------------------
  injection: [
    // === JAVASCRIPT/TYPESCRIPT ===
    {
      pattern: /`\s*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\b.*\$\{/gi,
      title: 'SQL Injection (Template Literal)',
      description: 'Template literal with variable interpolation in SQL query.',
      fix: "Use parameterized queries instead of string interpolation.",
      severity: 'critical',
      languages: ['javascript', 'typescript']
    },
    {
      pattern: /\$\{[^}]+\}.*?(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)/gi,
      title: 'SQL Injection (String Interpolation)',
      description: 'Direct string interpolation in SQL query allows attackers to manipulate database queries.',
      fix: "Use parameterized queries: db.query('SELECT * FROM users WHERE email = ?', [email])",
      severity: 'critical',
      languages: ['javascript', 'typescript']
    },
    {
      pattern: /(?:exec|execute|query|raw)\s*\(\s*['"`].*\$\{/gi,
      title: 'Potential SQL Injection',
      description: 'Executing raw SQL with template literals is dangerous.',
      fix: 'Use an ORM or parameterized queries.',
      severity: 'critical',
      languages: ['javascript', 'typescript']
    },
    {
      pattern: /['"`]\s*\+\s*\w+\s*\+\s*['"`].*(?:SELECT|INSERT|UPDATE|DELETE)/gi,
      title: 'SQL Injection (Concatenation)',
      description: 'String concatenation in SQL query enables injection.',
      fix: "Use parameterized queries with placeholders.",
      severity: 'critical',
      languages: ['javascript', 'typescript', 'java', 'php']
    },
    // Node.js Command Injection
    {
      pattern: /(?:child_process|cp)\.exec\s*\(\s*['"`].*\$\{/gi,
      title: 'Command Injection (Node.js)',
      description: 'Passing unsanitized user input to exec() allows arbitrary command execution.',
      fix: 'Use execFile or spawn with argument arrays.',
      severity: 'critical',
      languages: ['javascript', 'typescript']
    },
    // NoSQL Injection
    {
      pattern: /\$where\s*:\s*['"`].*['"`]/gi,
      title: 'NoSQL Injection ($where)',
      description: 'MongoDB $where operator allows JavaScript execution.',
      fix: 'Avoid $where. Use standard query operators.',
      severity: 'high',
      languages: ['javascript', 'typescript']
    },

    // === PYTHON ===
    {
      pattern: /(?:os\.system|subprocess\.call|subprocess\.Popen|subprocess\.run)\s*\([^)]*shell\s*=\s*True/gi,
      title: 'Command Injection (Python)',
      description: 'Executing shell commands with shell=True is dangerous.',
      fix: 'Use subprocess.run with shell=False and pass args as a list.',
      severity: 'critical',
      languages: ['python']
    },
    {
      pattern: /os\.system\s*\(\s*f?['"]/gi,
      title: 'Command Injection (os.system)',
      description: 'os.system executes commands in a shell and is vulnerable to injection.',
      fix: 'Use subprocess.run() with a list of arguments.',
      severity: 'critical',
      languages: ['python']
    },
    {
      pattern: /cursor\.execute\s*\(\s*f?['"].*\{/gi,
      title: 'SQL Injection (Python f-string)',
      description: 'Using f-strings or format() in SQL queries enables injection.',
      fix: 'Use parameterized queries: cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))',
      severity: 'critical',
      languages: ['python']
    },
    {
      pattern: /\.execute\s*\(\s*['"].*%\s*\(/gi,
      title: 'SQL Injection (Python % formatting)',
      description: 'Using % string formatting in SQL queries is dangerous.',
      fix: 'Use parameterized queries with ? or %s placeholders.',
      severity: 'critical',
      languages: ['python']
    },

    // === GO ===
    {
      pattern: /fmt\.Sprintf\s*\(\s*['"`].*(?:SELECT|INSERT|UPDATE|DELETE|WHERE)/gi,
      title: 'SQL Injection (Go fmt.Sprintf)',
      description: 'Using fmt.Sprintf to build SQL queries enables injection.',
      fix: 'Use parameterized queries: db.Query("SELECT * FROM users WHERE id = ?", id)',
      severity: 'critical',
      languages: ['go']
    },
    {
      pattern: /db\.(?:Query|Exec)\s*\(\s*['"`].*\+/gi,
      title: 'SQL Injection (Go string concatenation)',
      description: 'Concatenating strings in SQL queries is dangerous.',
      fix: 'Use parameterized queries with placeholders.',
      severity: 'critical',
      languages: ['go']
    },
    {
      pattern: /exec\.Command\s*\(\s*['"`][^'"]+['"`]\s*,.*\+/gi,
      title: 'Command Injection (Go)',
      description: 'Building command arguments with string concatenation is dangerous.',
      fix: 'Pass arguments as separate parameters to exec.Command.',
      severity: 'critical',
      languages: ['go']
    },

    // === JAVA ===
    {
      pattern: /Runtime\.getRuntime\(\)\.exec\s*\(/gi,
      title: 'Command Injection (Java Runtime.exec)',
      description: 'Runtime.exec can execute arbitrary commands if input is unsanitized.',
      fix: 'Validate and sanitize all input. Consider using ProcessBuilder with argument lists.',
      severity: 'critical',
      languages: ['java']
    },
    {
      pattern: /Statement.*\.execute(?:Query|Update)?\s*\(\s*['"].*\+/gi,
      title: 'SQL Injection (Java Statement)',
      description: 'Using Statement with string concatenation enables SQL injection.',
      fix: 'Use PreparedStatement with parameterized queries.',
      severity: 'critical',
      languages: ['java']
    },
    {
      pattern: /createStatement\s*\(\s*\)/gi,
      title: 'SQL Injection Risk (Java Statement)',
      description: 'Statement objects are vulnerable to SQL injection.',
      fix: 'Use PreparedStatement for all queries with user input.',
      severity: 'high',
      languages: ['java']
    },

    // === PHP ===
    {
      pattern: /(?:eval|assert)\s*\(\s*\$_(?:GET|POST|REQUEST)/gi,
      title: 'Remote Code Execution (PHP eval)',
      description: 'Passing user input to eval() allows arbitrary code execution.',
      fix: 'Never use eval with user input. Find an alternative approach.',
      severity: 'critical',
      languages: ['php']
    },
    {
      pattern: /(?:shell_exec|exec|system|passthru|popen)\s*\(\s*\$_(?:GET|POST|REQUEST)/gi,
      title: 'Command Injection (PHP)',
      description: 'Passing user input to shell functions enables command injection.',
      fix: 'Use escapeshellarg() and escapeshellcmd() to sanitize input.',
      severity: 'critical',
      languages: ['php']
    },
    {
      pattern: /mysql_query\s*\(\s*['"].*\.\s*\$_(?:GET|POST|REQUEST)/gi,
      title: 'SQL Injection (PHP mysql_query)',
      description: 'Concatenating user input in SQL queries enables injection.',
      fix: 'Use PDO or mysqli with prepared statements.',
      severity: 'critical',
      languages: ['php']
    },
    {
      pattern: /\$_(?:GET|POST|REQUEST|COOKIE)\s*\[/gi,
      title: 'Unsanitized User Input (PHP)',
      description: 'Direct use of superglobals without sanitization is risky.',
      fix: 'Always sanitize and validate: filter_input() or htmlspecialchars().',
      severity: 'medium',
      languages: ['php']
    },

    // === RUST ===
    {
      pattern: /Command::new\s*\(\s*format!/gi,
      title: 'Command Injection (Rust)',
      description: 'Using format! in Command::new could lead to injection if input is unsanitized.',
      fix: 'Pass arguments separately using .arg() method.',
      severity: 'high',
      languages: ['rust']
    }
  ],

  // ---------------------------------------------------------
  // 2. DESERIALIZATION VULNERABILITIES
  // ---------------------------------------------------------
  deserialization: [
    // Python
    {
      pattern: /pickle\.(?:loads?|Unpickler)/gi,
      title: 'Insecure Deserialization (Python pickle)',
      description: 'pickle can execute arbitrary code when loading untrusted data.',
      fix: 'Use JSON or other safe formats. Never unpickle untrusted data.',
      severity: 'critical',
      languages: ['python']
    },
    {
      pattern: /yaml\.load\s*\([^)]*\)(?!\s*,\s*Loader\s*=\s*yaml\.SafeLoader)/gi,
      title: 'Insecure YAML Loading (Python)',
      description: 'yaml.load without SafeLoader can execute arbitrary code.',
      fix: 'Use yaml.safe_load() or yaml.load(data, Loader=yaml.SafeLoader).',
      severity: 'critical',
      languages: ['python']
    },
    {
      pattern: /yaml\.load\s*\(/gi,
      title: 'YAML Loading (Verify SafeLoader)',
      description: 'Ensure yaml.load uses SafeLoader to prevent code execution.',
      fix: 'Use yaml.safe_load() or specify Loader=yaml.SafeLoader.',
      severity: 'high',
      languages: ['python']
    },
    // Java
    {
      pattern: /ObjectInputStream.*\.readObject\s*\(/gi,
      title: 'Insecure Deserialization (Java)',
      description: 'Deserializing untrusted data can lead to remote code execution.',
      fix: 'Validate and filter classes before deserialization. Use allowlists.',
      severity: 'critical',
      languages: ['java']
    },
    {
      pattern: /XMLDecoder.*\.readObject\s*\(/gi,
      title: 'Insecure XML Deserialization (Java)',
      description: 'XMLDecoder can execute arbitrary code from untrusted XML.',
      fix: 'Avoid XMLDecoder for untrusted input. Use safe XML parsers.',
      severity: 'critical',
      languages: ['java']
    },
    // PHP
    {
      pattern: /unserialize\s*\(\s*\$_(?:GET|POST|REQUEST|COOKIE)/gi,
      title: 'Insecure Deserialization (PHP)',
      description: 'unserialize with user input can lead to object injection.',
      fix: 'Use JSON instead of serialize/unserialize for untrusted data.',
      severity: 'critical',
      languages: ['php']
    }
  ],

  // ---------------------------------------------------------
  // 3. CRYPTOGRAPHIC FAILURES
  // ---------------------------------------------------------
  crypto: [
    {
      pattern: /crypto\.createHash\s*\(\s*['"`](?:md5|sha1)['"`]\s*\)/gi,
      title: 'Weak Hashing Algorithm',
      description: 'MD5 and SHA1 are collision-prone and insecure.',
      fix: "Use SHA-256 or stronger: crypto.createHash('sha256')",
      severity: 'medium',
      languages: ['javascript', 'typescript']
    },
    {
      pattern: /hashlib\.(?:md5|sha1)\s*\(/gi,
      title: 'Weak Hashing Algorithm (Python)',
      description: 'MD5 and SHA1 are insecure for cryptographic purposes.',
      fix: 'Use hashlib.sha256() or hashlib.sha3_256().',
      severity: 'medium',
      languages: ['python']
    },
    {
      pattern: /AES\.new\s*\([^,]+,\s*AES\.MODE_ECB/gi,
      title: 'Insecure Encryption Mode (ECB)',
      description: 'AES in ECB mode does not hide data patterns.',
      fix: 'Use GCM or CBC mode with a random IV.',
      severity: 'high',
      languages: ['python']
    },
    {
      pattern: /Math\.random\(\)/gi,
      title: 'Weak Random Number Generator',
      description: 'Math.random() is not cryptographically secure.',
      fix: 'Use crypto.getRandomValues() or crypto.randomBytes().',
      severity: 'low',
      languages: ['javascript', 'typescript']
    },
    {
      pattern: /random\.random\(\)|random\.randint\(/gi,
      title: 'Weak Random (Python)',
      description: 'random module is not cryptographically secure.',
      fix: 'Use secrets module for security-sensitive randomness.',
      severity: 'low',
      languages: ['python']
    },
    {
      pattern: /rand\(\)|mt_rand\(/gi,
      title: 'Weak Random (PHP)',
      description: 'rand() and mt_rand() are not cryptographically secure.',
      fix: 'Use random_bytes() or random_int() for security purposes.',
      severity: 'low',
      languages: ['php']
    }
  ],

  // ---------------------------------------------------------
  // 4. HARDCODED SECRETS (Extensive)
  // ---------------------------------------------------------
  secrets: [
    {
      pattern: /(?:password|passwd|pwd|secret|token|api[_-]?key|auth[_-]?token)\s*[:=]\s*['"`][^'"`]{3,}['"`]/gi,
      title: 'Generic Hardcoded Secret',
      description: 'Detected a potential hardcoded password, API key, or token.',
      fix: 'Store secrets in environment variables.',
      severity: 'critical',
      languages: ['all']
    },
    {
      pattern: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g,
      title: 'AWS Access Key ID',
      description: 'AWS Access Key detected.',
      fix: 'Revoke immediately and use IAM roles or env vars.',
      severity: 'critical',
      languages: ['all']
    },
    {
      pattern: /AIza[0-9A-Za-z\\-_]{35}/g,
      title: 'Google API Key',
      description: 'Google Cloud API Key detected.',
      fix: 'Restrict key scope and move to environment variables.',
      severity: 'high',
      languages: ['all']
    },
    {
      pattern: /-----BEGIN\s+(?:RSA|DSA|EC|PGP|OPENSSH)?\s+PRIVATE\s+KEY-----/g,
      title: 'Private Encryption Key',
      description: 'Private key found in source code.',
      fix: 'Remove key file from repo and load from secure storage.',
      severity: 'critical',
      languages: ['all']
    },
    {
      pattern: /xox[baprs]-([0-9a-zA-Z]{10,48})/g,
      title: 'Slack Token',
      description: 'Slack API Token detected.',
      fix: 'Revoke token and use OAuth or env vars.',
      severity: 'critical',
      languages: ['all']
    },
    {
      pattern: /(?:sk|pk)_(?:test|live)_[0-9a-zA-Z]{10,}/g,
      title: 'Stripe API Key',
      description: 'Stripe Secret/Publishable Key detected.',
      fix: 'Move to environment variables.',
      severity: 'critical',
      languages: ['all']
    },
    {
      pattern: /ghp_[0-9a-zA-Z]{36}/g,
      title: 'GitHub Personal Access Token',
      description: 'GitHub PAT detected in code.',
      fix: 'Use environment variables or GitHub Actions secrets.',
      severity: 'critical',
      languages: ['all']
    }
  ],

  // ---------------------------------------------------------
  // 5. XSS & CLIENT-SIDE RISKS
  // ---------------------------------------------------------
  xss: [
    {
      pattern: /\.innerHTML\s*=(?!.*(?:DOMPurify|sanitize|escape))/gi,
      title: 'XSS (innerHTML)',
      description: 'Unsanitized innerHTML allows script injection.',
      fix: 'Use textContent or DOMPurify.sanitize().',
      severity: 'high',
      languages: ['javascript', 'typescript']
    },
    {
      pattern: /dangerouslySetInnerHTML/g,
      title: 'React Dangerous HTML',
      description: 'React\'s replacement for innerHTML. Use only with trusted content.',
      fix: 'Sanitize content before passing to this prop.',
      severity: 'medium',
      languages: ['javascript', 'typescript']
    },
    {
      pattern: /document\.write\s*\(/gi,
      title: 'Obsolete document.write',
      description: 'Can lead to XSS and performance issues.',
      fix: 'Use modern DOM manipulation.',
      severity: 'high',
      languages: ['javascript', 'typescript']
    },
    {
      pattern: /\{\{.*\|safe\s*\}\}/gi,
      title: 'Django/Jinja2 Unsafe Filter',
      description: 'The |safe filter bypasses HTML escaping.',
      fix: 'Only use |safe with trusted, sanitized content.',
      severity: 'high',
      languages: ['python']
    },
    {
      pattern: /echo\s+\$_(?:GET|POST|REQUEST)/gi,
      title: 'XSS (PHP echo)',
      description: 'Echoing user input without escaping enables XSS.',
      fix: 'Use htmlspecialchars() to escape output.',
      severity: 'high',
      languages: ['php']
    }
  ],

  // ---------------------------------------------------------
  // 6. UNSAFE CODE BLOCKS
  // ---------------------------------------------------------
  unsafe: [
    {
      pattern: /eval\s*\(/gi,
      title: 'Code Injection via eval()',
      description: 'Dangerous function that executes arbitrary code.',
      fix: 'Remove eval() and find a safer alternative.',
      severity: 'critical',
      languages: ['javascript', 'typescript', 'python', 'php']
    },
    {
      pattern: /\bunsafe\s*\{/gi,
      title: 'Unsafe Block (Rust)',
      description: 'Unsafe blocks bypass Rust\'s memory safety guarantees.',
      fix: 'Minimize unsafe usage. Document why it\'s necessary.',
      severity: 'medium',
      languages: ['rust']
    },
    {
      pattern: /import\s+"unsafe"/gi,
      title: 'Unsafe Package (Go)',
      description: 'The unsafe package bypasses Go\'s type safety.',
      fix: 'Avoid unsafe unless absolutely necessary. Document usage.',
      severity: 'medium',
      languages: ['go']
    },
    {
      pattern: /exec\s*\(/gi,
      title: 'Python exec()',
      description: 'exec() executes arbitrary Python code.',
      fix: 'Avoid exec(). Use safer alternatives.',
      severity: 'critical',
      languages: ['python']
    },
    {
      pattern: /compile\s*\([^)]+['"`]exec['"`]/gi,
      title: 'Python compile() with exec',
      description: 'Compiling code for execution is dangerous.',
      fix: 'Avoid dynamic code execution.',
      severity: 'critical',
      languages: ['python']
    }
  ],

  // ---------------------------------------------------------
  // 7. MISCONFIGURATION & BAD PRACTICES
  // ---------------------------------------------------------
  config: [
    {
      pattern: /(?:debug|verbose)\s*[:=]\s*true/gi,
      title: 'Debug Mode Enabled',
      description: 'Debug mode may expose sensitive info.',
      fix: 'Ensure debug is false in production.',
      severity: 'low',
      languages: ['all']
    },
    {
      pattern: /DEBUG\s*=\s*True/gi,
      title: 'Django Debug Mode',
      description: 'Django DEBUG=True exposes sensitive information.',
      fix: 'Set DEBUG=False in production.',
      severity: 'high',
      languages: ['python']
    },
    {
      pattern: /http\.ListenAndServe\s*\(/gi,
      title: 'HTTP Without TLS (Go)',
      description: 'Serving over HTTP exposes data in transit.',
      fix: 'Use http.ListenAndServeTLS() for production.',
      severity: 'medium',
      languages: ['go']
    },
    {
      pattern: /CORS.*\*|Access-Control-Allow-Origin.*\*/gi,
      title: 'Permissive CORS Policy',
      description: 'Allowing all origins can expose APIs to cross-origin attacks.',
      fix: 'Specify allowed origins explicitly.',
      severity: 'medium',
      languages: ['all']
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
