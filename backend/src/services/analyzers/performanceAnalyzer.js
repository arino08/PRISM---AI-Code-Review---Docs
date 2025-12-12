/**
 * Performance Analyzer - Detects performance anti-patterns
 */

async function analyzePerformance(code, language = 'javascript') {
  const issues = [];
  const lines = code.split('\n');
  let issueId = 0;

  let inLoop = false;
  let braceCount = 0;

  lines.forEach((line, index) => {
    // Loop State Tracking
    if (/for\s*\(|\.forEach\s*\(|\.map\s*\(|while\s*\(|for\s+\w+\s+of\s+/.test(line)) {
      inLoop = true;
      braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    } else if (inLoop) {
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      if (braceCount <= 0) inLoop = false;
    }

    // ---------------------------------------------------
    // 1. REACT PERFORMANCE
    // ---------------------------------------------------
    // Missing Key in Map
    if (/\.map\s*\(/.test(line) && !/key\s*=/i.test(line)) {
      // Check surrounding lines roughly (simple heuristics)
      const context = lines.slice(index, Math.min(lines.length, index + 5)).join('\n');
      if (context.includes('<') && !context.includes('key=')) {
        issues.push({
          id: `perf-${issueId++}`,
          type: 'performance',
          category: 'react',
          severity: 'high',
          title: 'Missing "key" Prop',
          line: index + 1,
          description: 'A list of elements rendered via map() does not appear to have a unique "key" prop. This forces React to re-render the entire list on every update.',
          fix: 'Add a stable, unique key prop: <div key={item.id}>'
        });
      }
    }

    // Inline Object/Function Props
    if (/style\s*=\s*\{\{/.test(line) || /onClick\s*=\s*\{\s*\(\)\s*=>/.test(line)) {
      issues.push({
        id: `perf-${issueId++}`,
        type: 'performance',
        category: 'react',
        severity: 'low',
        title: 'Inline Object/Function Prop',
        line: index + 1,
        description: 'Inline objects/functions created in render cause child components to re-render on every parent update (broken memoization).',
        fix: 'Move handlers to useCallback and styles to variables/constants.'
      });
    }

    // ---------------------------------------------------
    // 2. BACKEND / NODE.JS PERFORMANCE
    // ---------------------------------------------------
    // N+1 Query (Database call in loop)
    if (inLoop && /await\s+.*\.(find|query|get|fetch|execute)/i.test(line)) {
      issues.push({
        id: `perf-${issueId++}`,
        type: 'performance',
        category: 'database',
        severity: 'high',
        title: 'N+1 Query Detected',
        line: index + 1,
        description: 'Executing a database query inside a loop causes exponential performance degradation.',
        fix: 'Batch fetch data before the loop (e.g., using "IN" clause) and map it in memory.'
      });
    }

    // Sync File Ops
    if (/fs\.(?:readFileSync|writeFileSync|statSync)/.test(line)) {
      issues.push({
        id: `perf-${issueId++}`,
        type: 'performance',
        category: 'node',
        severity: 'high',
        title: 'Blocking Synchronous I/O',
        line: index + 1,
        description: 'Synchronous I/O blocks the Node.js event loop, halting all other requests.',
        fix: 'Use the async version: fs.promises.readFile() or fs.readFile().'
      });
    }

    // ---------------------------------------------------
    // 3. GENERAL JS PERFORMANCE
    // ---------------------------------------------------
    // Regex in Loop
    if (inLoop && /new\s+RegExp/.test(line)) {
      issues.push({
        id: `perf-${issueId++}`,
        type: 'performance',
        category: 'optimization',
        severity: 'moderate',
        title: 'Regex Recompilation in Loop',
        line: index + 1,
        description: 'Creating a new RegExp instance in every iteration is expensive.',
        fix: 'Instantiate the RegExp outside the loop.'
      });
    }
  });

  return issues;
}

module.exports = { analyzePerformance };
