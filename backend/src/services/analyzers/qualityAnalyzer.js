/**
 * Quality Analyzer - Detects code quality issues and anti-patterns
 */

async function analyzeQuality(code, language = 'javascript') {
  const issues = [];
  const lines = code.split('\n');
  let issueId = 0;

  // -----------------------------------------------------
  // 1. Maintainability: Function Length (God Functions)
  // -----------------------------------------------------
  let funcStartLine = -1;
  let funcSize = 0;
  let inFunction = false;

  lines.forEach((line, index) => {
    // Basic function detection (regex is approximate for JS/TS)
    if (/function\s+\w+|=>\s*\{|(?:async\s+)?function\s*\(/.test(line)) {
      if (inFunction && funcSize > 50) {
        issues.push({
          id: `quality-${issueId++}`,
          type: 'quality',
          category: 'maintainability',
          severity: 'moderate',
          title: 'Long Function (God Function)',
          line: funcStartLine + 1,
          description: `Function exceeds 50 lines (${funcSize}). Large functions are hard to test and maintain.`,
          fix: 'Refactor into smaller helper functions.'
        });
      }
      funcStartLine = index;
      funcSize = 0;
      inFunction = true;
    }

    if (inFunction) {
      funcSize++;
      // Reset if we hit a closing brace at indentation 0 or 1 roughly (imperfect heuristic)
      if (/^\}\s*$/.test(line) || /^\s{2}\}\s*$/.test(line)) {
        inFunction = false;
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
      }
    }
  });

  // -----------------------------------------------------
  // 2. Cyclomatic Complexity / Deep Nesting
  // -----------------------------------------------------
  let nestingLevel = 0;
  let maxNesting = 0;
  let maxNestingLine = 0;

  lines.forEach((line, index) => {
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    nestingLevel += opens - closes;

    if (nestingLevel > maxNesting) {
      maxNesting = nestingLevel;
      maxNestingLine = index;
    }
  });

  if (maxNesting >= 5) {
    issues.push({
      id: `quality-${issueId++}`,
      type: 'quality',
      category: 'complexity',
      severity: 'moderate',
      title: 'High Cyclomatic Complexity',
      line: maxNestingLine + 1,
      description: `Deeply nested code (${maxNesting} levels) is hard to reason about.`,
      fix: 'Flatten logic using early returns (guard clauses) or extract methods.'
    });
  }

  // -----------------------------------------------------
  // 3. Error Handling
  // -----------------------------------------------------
  lines.forEach((line, index) => {
    // Missing handling for async/network checks
    if (/await\s+fetch\(/.test(line)) {
       const contextStart = Math.max(0, index - 10);
       const contextEnd = Math.min(lines.length, index + 10);
       const context = lines.slice(contextStart, contextEnd).join('\n');

       if (!/try\s*\{/.test(context) && !/\.catch\(/.test(context)) {
        issues.push({
          id: `quality-${issueId++}`,
          type: 'quality',
          category: 'reliability',
          severity: 'moderate',
          title: 'Unsafe Network Request',
          line: index + 1,
          description: 'Network request without try-catch or .catch() handling.',
          fix: 'Wrap in try/catch to handle potential network failures gracefully.'
        });
       }
    }

    // Empty Catch
    if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) {
       issues.push({
        id: `quality-${issueId++}`,
        type: 'quality',
        category: 'best-practices',
        severity: 'low',
        title: 'Empty Catch Block',
        line: index + 1,
        description: 'Silencing errors makes debugging impossible.',
        fix: 'Log the error or add a comment explaining why it is silenced.'
      });
    }
  });

  // -----------------------------------------------------
  // 4. Best Practices (Var, Magic Numbers, Console)
  // -----------------------------------------------------
  lines.forEach((line, index) => {
    // Var
    if (/\bvar\s+\w+/.test(line)) {
      issues.push({
        id: `quality-${issueId++}`,
        type: 'quality',
        category: 'modern-js',
        severity: 'low',
        title: 'Deprecated "var" Keyword',
        line: index + 1,
        description: 'var has loose scoping rules.',
        fix: 'Use const (default) or let (for reassignment).'
      });
    }

    // Magic Numbers (improved check)
    // Ignore if line contains common CSS properties or start with const/let
    if (/(?<![\w])\b[2-9]\d{2,}\b(?![\w])/.test(line)
        && !/const|let|var|import|export|from/.test(line)
        && !/width|height|margin|padding|port|status|code|year|month|day/.test(line)
        && !line.trim().startsWith('//')) {
      issues.push({
        id: `quality-${issueId++}`,
        type: 'quality',
        category: 'readability',
        severity: 'low',
        title: 'Magic Number Detected',
        line: index + 1,
        description: 'Unexplained numeric literal.',
        fix: 'Define as a named constant describing the value.'
      });
    }

    // Console Log (include warn, error, info, debug)
    if (/console\.(?:log|debug|info|warn|error)\(/.test(line)) {
      issues.push({
        id: `quality-${issueId++}`,
        type: 'quality',
        category: 'clean-code',
        severity: 'info',
        title: 'Console Statement Leftover',
        line: index + 1,
        description: 'Debug statement in code.',
        fix: 'Remove or use a proper logger.'
      });
    }

    // Parameter Count
    if (/function.*\(([^)]*)\)/.test(line)) {
       const params = line.match(/function.*\(([^)]*)\)/)[1].split(',');
       if (params.length > 4) {
         issues.push({
          id: `quality-${issueId++}`,
          type: 'quality',
          category: 'readability',
          severity: 'low',
          title: 'Too Many Parameters',
          line: index + 1,
          description: `Function accepts ${params.length} arguments.`,
          fix: 'Refactor to accept a single options object.'
         });
       }
    }
  });

  return issues;
}

module.exports = { analyzeQuality };
