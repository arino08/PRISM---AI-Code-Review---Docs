/**
 * Quality Analyzer - Detects code quality issues and anti-patterns
 * Supports: JavaScript, TypeScript, Python, Go, Java, Rust, PHP
 */

// Language-specific quality patterns
const QUALITY_PATTERNS = {
  errorHandling: [
    // JavaScript/TypeScript
    {
      pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
      title: 'Empty Catch Block',
      description: 'Silencing errors makes debugging impossible.',
      fix: 'Log the error or add a comment explaining why it is silenced.',
      severity: 'low',
      languages: ['javascript', 'typescript', 'java']
    },
    // Python bare except
    {
      pattern: /except\s*:/g,
      title: 'Bare Except Clause (Python)',
      description: 'Catching all exceptions hides bugs and catches system exceptions.',
      fix: 'Catch specific exceptions: except ValueError:',
      severity: 'moderate',
      languages: ['python']
    },
    {
      pattern: /except\s+Exception\s*:/g,
      title: 'Broad Exception Catch (Python)',
      description: 'Catching Exception is too broad and may hide bugs.',
      fix: 'Catch specific exceptions relevant to the code.',
      severity: 'low',
      languages: ['python']
    },
    // Go ignored errors
    {
      pattern: /,\s*_\s*:?=\s*\w+\([^)]*\)/g,
      title: 'Ignored Error (Go)',
      description: 'Discarding errors with _ can hide failures.',
      fix: 'Handle the error: if err != nil { return err }',
      severity: 'moderate',
      languages: ['go']
    },
    // Rust unwrap without handling
    {
      pattern: /\.unwrap\(\)/g,
      title: 'Unhandled unwrap() (Rust)',
      description: 'unwrap() will panic on None/Err values.',
      fix: 'Use match, if let, or ? operator for proper error handling.',
      severity: 'moderate',
      languages: ['rust']
    },
    {
      pattern: /\.expect\s*\(\s*["'][^"']*["']\s*\)/g,
      title: 'Panicking expect() (Rust)',
      description: 'expect() panics with a message on failure.',
      fix: 'Consider using ? operator or match for recoverable errors.',
      severity: 'low',
      languages: ['rust']
    }
  ],

  debugStatements: [
    // JavaScript/TypeScript
    {
      pattern: /console\.(?:log|debug|info|warn|error)\s*\(/g,
      title: 'Console Statement',
      description: 'Debug statement in code.',
      fix: 'Remove or use a proper logger.',
      severity: 'info',
      languages: ['javascript', 'typescript']
    },
    // Python
    {
      pattern: /\bprint\s*\(/g,
      title: 'Print Statement (Python)',
      description: 'Debug print statement in code.',
      fix: 'Use logging module instead of print().',
      severity: 'info',
      languages: ['python']
    },
    {
      pattern: /\bpdb\.set_trace\(\)/g,
      title: 'Debugger Breakpoint (Python)',
      description: 'pdb breakpoint left in code.',
      fix: 'Remove debugger breakpoint before committing.',
      severity: 'moderate',
      languages: ['python']
    },
    {
      pattern: /\bbreakpoint\s*\(\)/g,
      title: 'Breakpoint (Python 3.7+)',
      description: 'breakpoint() left in code.',
      fix: 'Remove breakpoint before committing.',
      severity: 'moderate',
      languages: ['python']
    },
    // Go
    {
      pattern: /fmt\.Print(?:ln|f)?\s*\(/g,
      title: 'fmt.Print Statement (Go)',
      description: 'Debug print statement in code.',
      fix: 'Use a structured logger like log or logrus.',
      severity: 'info',
      languages: ['go']
    },
    // Java
    {
      pattern: /System\.out\.print(?:ln)?\s*\(/g,
      title: 'System.out.print (Java)',
      description: 'Debug print statement in production code.',
      fix: 'Use a logging framework like SLF4J or Log4j.',
      severity: 'info',
      languages: ['java']
    },
    {
      pattern: /System\.err\.print(?:ln)?\s*\(/g,
      title: 'System.err.print (Java)',
      description: 'Error print to stderr instead of proper logging.',
      fix: 'Use a logging framework with appropriate log levels.',
      severity: 'low',
      languages: ['java']
    },
    // PHP
    {
      pattern: /\becho\s+['"$]/g,
      title: 'Echo Statement (PHP)',
      description: 'Debug echo statement in code.',
      fix: 'Use proper logging or remove.',
      severity: 'info',
      languages: ['php']
    },
    {
      pattern: /\bvar_dump\s*\(/g,
      title: 'var_dump (PHP)',
      description: 'Debug var_dump left in code.',
      fix: 'Remove debug statement.',
      severity: 'moderate',
      languages: ['php']
    },
    {
      pattern: /\bprint_r\s*\(/g,
      title: 'print_r (PHP)',
      description: 'Debug print_r left in code.',
      fix: 'Remove debug statement.',
      severity: 'info',
      languages: ['php']
    }
  ],

  antiPatterns: [
    // JavaScript var usage
    {
      pattern: /\bvar\s+\w+/g,
      title: 'Deprecated "var" Keyword',
      description: 'var has loose scoping rules.',
      fix: 'Use const (default) or let (for reassignment).',
      severity: 'low',
      languages: ['javascript']
    },
    // Python mutable default args
    {
      pattern: /def\s+\w+\s*\([^)]*=\s*\[\s*\]/g,
      title: 'Mutable Default Argument (Python)',
      description: 'Lists as default args are shared between calls.',
      fix: 'Use None as default and create list inside function.',
      severity: 'moderate',
      languages: ['python']
    },
    {
      pattern: /def\s+\w+\s*\([^)]*=\s*\{\s*\}/g,
      title: 'Mutable Default Argument (Python)',
      description: 'Dicts as default args are shared between calls.',
      fix: 'Use None as default and create dict inside function.',
      severity: 'moderate',
      languages: ['python']
    },
    // PHP @ error suppression
    {
      pattern: /@\s*\$/g,
      title: 'Error Suppression (PHP)',
      description: 'The @ operator hides errors.',
      fix: 'Handle errors properly instead of suppressing.',
      severity: 'moderate',
      languages: ['php']
    },
    // Global variables
    {
      pattern: /\bglobal\s+\$/g,
      title: 'Global Variable (PHP)',
      description: 'Global variables make code hard to test and maintain.',
      fix: 'Pass variables as function parameters.',
      severity: 'low',
      languages: ['php']
    },
    {
      pattern: /\bglobal\s+\w+/g,
      title: 'Global Variable (Python)',
      description: 'Global keyword indicates shared mutable state.',
      fix: 'Consider using class attributes or passing as parameters.',
      severity: 'low',
      languages: ['python']
    }
  ],

  todoComments: [
    {
      pattern: /(?:\/\/|#|\/\*)\s*(?:TODO|FIXME|HACK|XXX|BUG):/gi,
      title: 'TODO/FIXME Comment',
      description: 'Unresolved task or known issue in code.',
      fix: 'Address the TODO or create a ticket to track it.',
      severity: 'info',
      languages: ['all']
    }
  ]
};

async function analyzeQuality(code, language = 'javascript') {
  const issues = [];
  const lines = code.split('\n');
  let issueId = 0;

  // Check pattern-based rules
  for (const [category, patterns] of Object.entries(QUALITY_PATTERNS)) {
    for (const rule of patterns) {
      // Check if rule applies to this language
      if (rule.languages && !rule.languages.includes('all') && !rule.languages.includes(language)) {
        continue;
      }

      lines.forEach((line, index) => {
        const linePattern = new RegExp(rule.pattern.source, rule.pattern.flags);
        if (linePattern.test(line)) {
          issues.push({
            id: `quality-${issueId++}`,
            type: 'quality',
            category,
            severity: rule.severity,
            title: rule.title,
            line: index + 1,
            description: rule.description,
            code: line.trim(),
            fix: rule.fix
          });
        }
      });
    }
  }

  // -----------------------------------------------------
  // Function Length Check (Language-aware)
  // -----------------------------------------------------
  let funcStartLine = -1;
  let funcSize = 0;
  let inFunction = false;

  const funcPatterns = {
    javascript: /function\s+\w+|=>\s*\{|(?:async\s+)?function\s*\(/,
    typescript: /function\s+\w+|=>\s*\{|(?:async\s+)?function\s*\(/,
    python: /^\s*def\s+\w+\s*\(/,
    go: /^func\s+/,
    java: /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+\w+\s*\([^)]*\)\s*\{/,
    rust: /fn\s+\w+/,
    php: /function\s+\w+\s*\(/
  };

  const funcPattern = funcPatterns[language] || funcPatterns.javascript;

  lines.forEach((line, index) => {
    if (funcPattern.test(line)) {
      if (inFunction && funcSize > 50) {
        issues.push({
          id: `quality-${issueId++}`,
          type: 'quality',
          category: 'maintainability',
          severity: 'moderate',
          title: 'Long Function',
          line: funcStartLine + 1,
          description: `Function exceeds 50 lines (${funcSize}).`,
          fix: 'Split logic into smaller components.'
        });
      }
      funcStartLine = index;
      funcSize = 0;
      inFunction = true;
    }

    if (inFunction) {
      funcSize++;
      // Language-specific function end detection
      const endPatterns = {
        python: /^\S/,  // New top-level code (rough)
        default: /^\s{0,2}\}\s*$/
      };
      const endPattern = endPatterns[language] || endPatterns.default;

      if (endPattern.test(line) && funcSize > 1) {
        if (funcSize > 50) {
          issues.push({
            id: `quality-${issueId++}`,
            type: 'quality',
            category: 'maintainability',
            severity: 'moderate',
            title: 'Long Function',
            line: funcStartLine + 1,
            description: `Function exceeds 50 lines (${funcSize}).`,
            fix: 'Split logic into smaller components.'
          });
        }
        inFunction = false;
      }
    }
  });

  // -----------------------------------------------------
  // Nesting Depth Check
  // -----------------------------------------------------
  let nestingLevel = 0;
  let maxNesting = 0;
  let maxNestingLine = 0;

  // Use braces for most languages, indentation for Python
  if (language === 'python') {
    let prevIndent = 0;
    lines.forEach((line, index) => {
      if (line.trim()) {
        const indent = line.match(/^\s*/)[0].length;
        if (indent > prevIndent) {
          nestingLevel++;
        } else if (indent < prevIndent) {
          nestingLevel = Math.floor(indent / 4);
        }
        if (nestingLevel > maxNesting) {
          maxNesting = nestingLevel;
          maxNestingLine = index;
        }
        prevIndent = indent;
      }
    });
  } else {
    lines.forEach((line, index) => {
      const opens = (line.match(/\{/g) || []).length;
      const closes = (line.match(/\}/g) || []).length;
      nestingLevel += opens - closes;

      if (nestingLevel > maxNesting) {
        maxNesting = nestingLevel;
        maxNestingLine = index;
      }
    });
  }

  if (maxNesting >= 5) {
    issues.push({
      id: `quality-${issueId++}`,
      type: 'quality',
      category: 'complexity',
      severity: 'moderate',
      title: 'High Cyclomatic Complexity',
      line: maxNestingLine + 1,
      description: `Deeply nested code (${maxNesting} levels) is hard to maintain.`,
      fix: 'Flatten logic using early returns or extract methods.'
    });
  }

  return issues;
}

module.exports = { analyzeQuality };
