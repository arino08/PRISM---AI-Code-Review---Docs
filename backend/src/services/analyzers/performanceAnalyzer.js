/**
 * Performance Analyzer - Detects performance anti-patterns
 * Supports: JavaScript, TypeScript, Python, Go, Java, Rust, PHP
 */

// Language-specific performance patterns
const PERFORMANCE_PATTERNS = {
  nPlusOne: [
    {
      pattern: /await\s+.*\.(?:find|query|get|fetch|execute)/gi,
      title: 'N+1 Query Detected',
      description: 'Database query inside a loop causes exponential performance degradation.',
      fix: 'Batch fetch data before the loop using "IN" clause.',
      severity: 'high',
      languages: ['javascript', 'typescript'],
      requiresLoop: true
    },
    {
      pattern: /\.objects\.(?:get|filter|all)\s*\(/gi,
      title: 'N+1 Query (Django ORM)',
      description: 'ORM query in a loop causes multiple database hits.',
      fix: 'Use select_related() or prefetch_related().',
      severity: 'high',
      languages: ['python'],
      requiresLoop: true
    },
    {
      pattern: /session\.(?:query|execute)\s*\(/gi,
      title: 'N+1 Query (SQLAlchemy)',
      description: 'Database query in loop. Consider using joinedload.',
      fix: 'Use joinedload or subqueryload for eager loading.',
      severity: 'high',
      languages: ['python'],
      requiresLoop: true
    },
    {
      pattern: /\.Query\s*\(|\.Find\s*\(|\.First\s*\(/gi,
      title: 'N+1 Query (GORM)',
      description: 'Database query inside a loop.',
      fix: 'Use Preload() for eager loading relationships.',
      severity: 'high',
      languages: ['go'],
      requiresLoop: true
    }
  ],

  stringConcat: [
    {
      pattern: /\+=\s*["'`]/gi,
      title: 'String Concatenation in Loop',
      description: 'String concatenation with += creates new strings each iteration.',
      fix: 'Use array.join() or template literals.',
      severity: 'moderate',
      languages: ['javascript', 'typescript'],
      requiresLoop: true
    },
    {
      pattern: /\+=\s*["']/gi,
      title: 'String Concatenation in Loop (Python)',
      description: 'String += in loops is O(n²). Creates new string each time.',
      fix: 'Use list.append() then "".join(list).',
      severity: 'moderate',
      languages: ['python'],
      requiresLoop: true
    },
    {
      pattern: /\+\s*["'][^"']*["']/gi,
      title: 'String Concatenation in Loop (Go)',
      description: 'String + in loops is inefficient in Go.',
      fix: 'Use strings.Builder for efficient concatenation.',
      severity: 'moderate',
      languages: ['go'],
      requiresLoop: true
    },
    {
      pattern: /\+\s*["'][^"']*["']/gi,
      title: 'String Concatenation in Loop (Java)',
      description: 'String + in loops creates many objects.',
      fix: 'Use StringBuilder for loops.',
      severity: 'moderate',
      languages: ['java'],
      requiresLoop: true
    }
  ],

  blockingIO: [
    {
      pattern: /fs\.(?:readFileSync|writeFileSync|statSync|mkdirSync)/gi,
      title: 'Blocking Synchronous I/O',
      description: 'Synchronous I/O blocks the Node.js event loop.',
      fix: 'Use async version: fs.promises.readFile().',
      severity: 'high',
      languages: ['javascript', 'typescript']
    },
    {
      pattern: /time\.sleep\s*\(/gi,
      title: 'Blocking Sleep (Python)',
      description: 'time.sleep() blocks the thread.',
      fix: 'Use asyncio.sleep() in async code.',
      severity: 'moderate',
      languages: ['python']
    },
    {
      pattern: /Thread\.sleep\s*\(/gi,
      title: 'Blocking Sleep (Java)',
      description: 'Thread.sleep() blocks the thread.',
      fix: 'Consider using ScheduledExecutorService for delayed tasks.',
      severity: 'moderate',
      languages: ['java']
    }
  ],

  react: [
    {
      pattern: /style\s*=\s*\{\{/gi,
      title: 'Inline Object Prop',
      description: 'Inline objects in render cause unnecessary re-renders.',
      fix: 'Move style object outside component or use useMemo.',
      severity: 'low',
      languages: ['javascript', 'typescript']
    },
    {
      pattern: /onClick\s*=\s*\{\s*\(\)\s*=>/gi,
      title: 'Inline Function Prop',
      description: 'Inline arrow functions break memoization.',
      fix: 'Move to useCallback hook.',
      severity: 'low',
      languages: ['javascript', 'typescript']
    }
  ],

  inefficientPatterns: [
    {
      pattern: /new\s+RegExp/gi,
      title: 'RegExp Recompilation in Loop',
      description: 'Creating RegExp in a loop is expensive.',
      fix: 'Define the RegExp outside the loop.',
      severity: 'moderate',
      languages: ['javascript', 'typescript'],
      requiresLoop: true
    },
    {
      pattern: /\.keys\(\)\s*\.\s*length/gi,
      title: 'Inefficient Object Size Check',
      description: 'Object.keys().length iterates all keys.',
      fix: 'Consider tracking size separately if called frequently.',
      severity: 'low',
      languages: ['javascript', 'typescript']
    },
    {
      pattern: /range\s*\(\s*len\s*\(/gi,
      title: 'Pythonic Loop Pattern',
      description: 'range(len()) is not Pythonic.',
      fix: 'Use enumerate() or iterate directly.',
      severity: 'low',
      languages: ['python']
    }
  ]
};

async function analyzePerformance(code, language = 'javascript') {
  const issues = [];
  const lines = code.split('\n');
  let issueId = 0;

  // Track loop context
  let inLoop = false;
  let braceCount = 0;
  let loopStartLine = 0;

  // Language-specific loop patterns
  const loopPatterns = {
    javascript: /for\s*\(|\.forEach\s*\(|\.map\s*\(|while\s*\(|for\s+\w+\s+of\s+/,
    typescript: /for\s*\(|\.forEach\s*\(|\.map\s*\(|while\s*\(|for\s+\w+\s+of\s+/,
    python: /for\s+\w+\s+in\s+|while\s+/,
    go: /for\s+|range\s+/,
    java: /for\s*\(|while\s*\(|\.forEach\s*\(/,
    rust: /for\s+\w+\s+in\s+|while\s+|loop\s*\{/,
    php: /for\s*\(|foreach\s*\(|while\s*\(/
  };

  const loopPattern = loopPatterns[language] || loopPatterns.javascript;

  lines.forEach((line, index) => {
    // Track loop state
    if (loopPattern.test(line)) {
      inLoop = true;
      loopStartLine = index;
      braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;

      // Python uses indentation
      if (language === 'python') {
        braceCount = 1; // Simulate being in a block
      }
    } else if (inLoop) {
      if (language === 'python') {
        // Check if we're back to original indentation
        if (line.trim() && !line.startsWith(' ') && !line.startsWith('\t')) {
          inLoop = false;
        }
      } else {
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;
        if (braceCount <= 0) inLoop = false;
      }
    }

    // Check patterns
    for (const [category, patterns] of Object.entries(PERFORMANCE_PATTERNS)) {
      for (const rule of patterns) {
        // Check language
        if (!rule.languages.includes(language)) continue;

        // Check loop requirement
        if (rule.requiresLoop && !inLoop) continue;

        const linePattern = new RegExp(rule.pattern.source, rule.pattern.flags);
        if (linePattern.test(line)) {
          issues.push({
            id: `perf-${issueId++}`,
            type: 'performance',
            category,
            severity: rule.severity,
            title: rule.title,
            line: index + 1,
            description: rule.description,
            code: line.trim(),
            fix: rule.fix
          });
        }
      }
    }

    // React list key check (JS/TS only)
    if ((language === 'javascript' || language === 'typescript') && /\.map\s*\(/.test(line)) {
      const context = lines.slice(index, Math.min(lines.length, index + 5)).join('\n');
      if (context.includes('<') && !context.includes('key=')) {
        issues.push({
          id: `perf-${issueId++}`,
          type: 'performance',
          category: 'react',
          severity: 'high',
          title: 'Missing "key" Prop',
          line: index + 1,
          description: 'List elements without unique key prop cause full re-renders.',
          fix: 'Add a stable, unique key prop: <div key={item.id}>'
        });
      }
    }
  });

  return issues;
}

module.exports = { analyzePerformance };
