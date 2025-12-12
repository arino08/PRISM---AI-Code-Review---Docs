/**
 * Documentation Generator - Generates JSDoc and README documentation from code
 */

async function generateDocumentation(code, language = 'javascript') {
  const functions = extractFunctions(code);
  const classes = extractClasses(code);

  // Generate JSDoc
  let jsdoc = '';

  // Document classes first
  classes.forEach(cls => {
    jsdoc += generateClassDoc(cls) + '\n\n';
  });

  // Document standalone functions
  functions.filter(f => !f.className).forEach(func => {
    jsdoc += generateJSDoc(func) + '\n\n';
  });

  // Generate README section
  const readme = generateReadme(functions, classes);

  return { jsdoc: jsdoc.trim(), readme };
}

function extractFunctions(code) {
  const functions = [];
  const lines = code.split('\n');

  const funcPattern = /(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/;
  const arrowPattern = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/;
  const methodPattern = /(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*\{/;

  let inClass = false;
  let className = '';
  let braceCount = 0;

  lines.forEach((line, index) => {
    // Track class context
    const classMatch = line.match(/class\s+(\w+)/);
    if (classMatch) {
      inClass = true;
      className = classMatch[1];
    }

    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;

    if (braceCount === 0 && inClass) {
      inClass = false;
      className = '';
    }

    // Match functions
    let match = line.match(funcPattern) || line.match(arrowPattern);
    if (!match && inClass) {
      match = line.match(methodPattern);
    }

    if (match && !['if', 'for', 'while', 'switch', 'catch'].includes(match[1])) {
      const name = match[1];
      const params = match[2].split(',').map(p => p.trim()).filter(Boolean);

      // Get function body for analysis
      const bodyLines = [];
      let bodyBraces = 0;
      let started = false;

      for (let i = index; i < Math.min(index + 50, lines.length); i++) {
        const l = lines[i];
        if (l.includes('{')) started = true;
        if (started) {
          bodyLines.push(l);
          bodyBraces += (l.match(/\{/g) || []).length;
          bodyBraces -= (l.match(/\}/g) || []).length;
          if (bodyBraces === 0) break;
        }
      }

      functions.push({
        name,
        params,
        line: index + 1,
        isAsync: line.includes('async'),
        isMethod: inClass,
        className: inClass ? className : null,
        body: bodyLines.join('\n'),
        raw: line.trim()
      });
    }
  });

  return functions;
}

function extractClasses(code) {
  const classes = [];
  const lines = code.split('\n');

  let currentClass = null;
  let braceCount = 0;
  let classStartLine = -1;

  lines.forEach((line, index) => {
    const classMatch = line.match(/class\s+(\w+)(?:\s+extends\s+(\w+))?/);

    if (classMatch) {
      currentClass = {
        name: classMatch[1],
        extends: classMatch[2] || null,
        line: index + 1,
        methods: []
      };
      classStartLine = index;
    }

    if (currentClass) {
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;

      // Find methods within class
      const methodMatch = line.match(/(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*\{/);
      if (methodMatch && !['if', 'for', 'while', 'switch', 'catch'].includes(methodMatch[1])) {
        currentClass.methods.push({
          name: methodMatch[1],
          params: methodMatch[2].split(',').map(p => p.trim()).filter(Boolean),
          isAsync: line.includes('async'),
          line: index + 1
        });
      }

      if (braceCount === 0 && index > classStartLine) {
        classes.push(currentClass);
        currentClass = null;
      }
    }
  });

  return classes;
}

function generateClassDoc(cls) {
  let doc = '/**\n';
  doc += ` * ${cls.name} - ${inferClassPurpose(cls.name)}\n`;

  if (cls.extends) {
    doc += ` * @extends ${cls.extends}\n`;
  }

  doc += ` *\n`;
  doc += ` * @class\n`;

  // Document constructor if exists
  const constructor = cls.methods.find(m => m.name === 'constructor');
  if (constructor) {
    constructor.params.forEach(param => {
      const cleanParam = param.replace(/[=:].*/g, '').trim();
      if (cleanParam) {
        doc += ` * @param {${inferType(cleanParam)}} ${cleanParam} - ${inferParamDescription(cleanParam)}\n`;
      }
    });
  }

  doc += ` *\n`;
  doc += ` * @example\n`;
  doc += ` * const ${cls.name.toLowerCase()} = new ${cls.name}(${constructor ? generateExampleArgs(constructor.params) : ''});\n`;

  // List methods
  if (cls.methods.length > 0) {
    doc += ` *\n`;
    doc += ` * @property {Function} ${cls.methods.map(m => m.name).join(' - Method\\n * @property {Function} ')}\n`;
  }

  doc += ` */`;

  return doc;
}

function generateJSDoc(func) {
  const { name, params, isAsync, isMethod, className, body } = func;

  const purpose = inferPurpose(name, body);
  const returnType = inferReturnType(name, body, isAsync);

  let doc = '/**\n';
  doc += ` * ${purpose}\n`;
  doc += ` *\n`;

  // Document parameters with inferred types
  params.forEach(param => {
    const cleanParam = param.replace(/[=:].*/g, '').trim();
    if (cleanParam) {
      const paramType = inferType(cleanParam, body);
      const paramDesc = inferParamDescription(cleanParam, name);
      doc += ` * @param {${paramType}} ${cleanParam} - ${paramDesc}\n`;
    }
  });

  // Document return value
  if (returnType !== 'void') {
    const returnDesc = inferReturnDescription(name, returnType);
    if (isAsync) {
      doc += ` * @returns {Promise<${returnType}>} ${returnDesc}\n`;
    } else {
      doc += ` * @returns {${returnType}} ${returnDesc}\n`;
    }
  }

  // Add throws documentation if applicable
  if (body && /throw\s+new\s+(\w+Error)/.test(body)) {
    const errorMatch = body.match(/throw\s+new\s+(\w+Error)/);
    doc += ` * @throws {${errorMatch[1]}} When operation fails\n`;
  }

  // Add example
  doc += ` *\n`;
  doc += ` * @example\n`;
  doc += ` * ${generateExample(func, returnType)}\n`;

  doc += ` */`;

  return doc;
}

function inferPurpose(name, body = '') {
  const prefixes = {
    'get': 'Retrieves',
    'set': 'Sets or updates',
    'fetch': 'Fetches data for',
    'find': 'Finds and returns',
    'create': 'Creates a new',
    'update': 'Updates an existing',
    'delete': 'Deletes',
    'remove': 'Removes',
    'calc': 'Calculates',
    'compute': 'Computes',
    'is': 'Checks whether',
    'has': 'Determines if has',
    'can': 'Checks if able to',
    'validate': 'Validates',
    'parse': 'Parses and processes',
    'format': 'Formats',
    'convert': 'Converts',
    'handle': 'Handles',
    'process': 'Processes',
    'init': 'Initializes',
    'load': 'Loads',
    'save': 'Saves',
    'send': 'Sends',
    'receive': 'Receives',
  };

  const nameLower = name.toLowerCase();

  for (const [prefix, verb] of Object.entries(prefixes)) {
    if (nameLower.startsWith(prefix)) {
      const rest = name.slice(prefix.length);
      const readable = rest.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
      return `${verb} ${readable || 'the value'}`;
    }
  }

  // Analyze body for more context
  if (body) {
    if (/\.reduce\s*\(/.test(body)) {
      return `Reduces/aggregates ${name.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}`;
    }
    if (/\.filter\s*\(/.test(body)) {
      return `Filters ${name.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}`;
    }
    if (/\.map\s*\(/.test(body)) {
      return `Transforms ${name.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}`;
    }
  }

  // Default: convert camelCase to readable
  const readable = name.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  return `Performs the ${readable} operation`;
}

function inferType(param, body = '') {
  const patterns = {
    'id': 'string|number',
    'ids': 'Array<string|number>',
    'name': 'string',
    'email': 'string',
    'url': 'string',
    'path': 'string',
    'data': 'Object',
    'opts': 'Object',
    'options': 'Object',
    'config': 'Object',
    'settings': 'Object',
    'callback': 'Function',
    'fn': 'Function',
    'handler': 'Function',
    'count': 'number',
    'index': 'number',
    'num': 'number',
    'amount': 'number',
    'price': 'number',
    'total': 'number',
    'flag': 'boolean',
    'enabled': 'boolean',
    'active': 'boolean',
    'items': 'Array',
    'list': 'Array',
    'arr': 'Array',
    'array': 'Array',
    'db': 'Object',
    'user': 'Object',
    'req': 'Request',
    'res': 'Response',
    'err': 'Error',
    'error': 'Error',
    // Single letter common params
    'u': 'Object',
    'p': 'Array',
    'd': 'Object',
    'i': 'number',
    'j': 'number',
    'n': 'number',
    's': 'string',
    't': 'any',
  };

  const paramLower = param.toLowerCase();
  return patterns[paramLower] || patterns[param] || 'any';
}

function inferParamDescription(param, funcName = '') {
  const descriptions = {
    'id': 'Unique identifier for the resource',
    'url': 'Target URL endpoint',
    'data': 'Data payload to process',
    'opts': 'Optional configuration object',
    'options': 'Configuration options',
    'config': 'Configuration settings',
    'callback': 'Callback function to execute',
    'fn': 'Function to apply',
    'handler': 'Handler function',
    'db': 'Database connection instance',
    'user': 'User object',
    'req': 'HTTP request object',
    'res': 'HTTP response object',
    'items': 'Array of items to process',
    'u': 'User object with properties',
    'p': 'Products/items array',
    'd': 'Discount/data configuration',
  };

  return descriptions[param] || descriptions[param.toLowerCase()] || `The ${param} parameter`;
}

function inferReturnType(name, body = '', isAsync = false) {
  const nameLower = name.toLowerCase();

  if (nameLower.startsWith('is') || nameLower.startsWith('has') || nameLower.startsWith('can')) {
    return 'boolean';
  }
  if (nameLower.startsWith('get') || nameLower.startsWith('find') || nameLower.startsWith('fetch')) {
    if (body && /return\s+null/.test(body)) {
      return 'Object|null';
    }
    return 'Object';
  }
  if (nameLower.startsWith('create') || nameLower.startsWith('add')) {
    return 'Object';
  }
  if (nameLower.startsWith('calc') || nameLower.startsWith('compute') || nameLower.startsWith('count')) {
    return 'number';
  }
  if (nameLower.startsWith('delete') || nameLower.startsWith('remove')) {
    return 'boolean';
  }
  if (nameLower === 'constructor') {
    return 'void';
  }

  // Analyze body
  if (body) {
    if (/return\s+true|return\s+false/.test(body)) {
      return 'boolean';
    }
    if (/return\s+\d+/.test(body)) {
      return 'number';
    }
    if (/return\s+['"`]/.test(body)) {
      return 'string';
    }
    if (/return\s+\[/.test(body)) {
      return 'Array';
    }
    if (/return\s+\{/.test(body)) {
      return 'Object';
    }
  }

  return 'any';
}

function inferReturnDescription(name, returnType) {
  if (returnType === 'boolean') {
    return 'True if successful, false otherwise';
  }
  if (returnType === 'Object|null') {
    return 'The found object or null if not found';
  }
  if (name.toLowerCase().startsWith('create')) {
    return 'The newly created object';
  }
  if (name.toLowerCase().startsWith('calc') || name.toLowerCase().startsWith('compute')) {
    return 'The calculated result';
  }
  if (returnType === 'Array') {
    return 'Array of results';
  }
  return 'The operation result';
}

function generateExampleArgs(params) {
  return params.map(p => {
    const clean = p.replace(/[=:].*/g, '').trim();
    if (['id'].includes(clean)) return '"abc123"';
    if (['url', 'path'].includes(clean)) return '"https://api.example.com"';
    if (['data', 'opts', 'options', 'config', 'db', 'u', 'd'].includes(clean)) return '{ /* ... */ }';
    if (['p', 'items', 'list'].includes(clean)) return '[...]';
    if (['count', 'num', 'amount'].includes(clean)) return '10';
    if (['flag', 'enabled'].includes(clean)) return 'true';
    return clean;
  }).join(', ');
}

function generateExample(func, returnType) {
  const { name, params, isAsync, isMethod, className } = func;

  const args = generateExampleArgs(params);
  const varName = returnType === 'void' ? '' : 'const result = ';

  if (isMethod && className) {
    const instanceName = className.charAt(0).toLowerCase() + className.slice(1);
    if (isAsync) {
      return `${varName}await ${instanceName}.${name}(${args});`;
    }
    return `${varName}${instanceName}.${name}(${args});`;
  }

  if (isAsync) {
    return `${varName}await ${name}(${args});`;
  }
  return `${varName}${name}(${args});`;
}

function inferClassPurpose(name) {
  const patterns = {
    'Service': 'Service layer for handling',
    'Controller': 'Controller for managing',
    'Repository': 'Data access layer for',
    'Manager': 'Manager for handling',
    'Handler': 'Handler for processing',
    'Factory': 'Factory for creating',
    'Builder': 'Builder for constructing',
    'Validator': 'Validator for checking',
    'Helper': 'Helper utilities for',
    'Utils': 'Utility functions for',
  };

  for (const [suffix, description] of Object.entries(patterns)) {
    if (name.endsWith(suffix)) {
      const entity = name.slice(0, -suffix.length);
      const readable = entity.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
      return `${description} ${readable} operations`;
    }
  }

  const readable = name.replace(/([A-Z])/g, ' $1').trim();
  return `${readable} class for handling related operations`;
}

function generateReadme(functions, classes) {
  let readme = '# API Reference\n\n';
  readme += 'Auto-generated documentation for this module.\n\n';
  readme += '---\n\n';

  // Document classes
  if (classes.length > 0) {
    readme += '## Classes\n\n';

    classes.forEach(cls => {
      readme += `### ${cls.name}\n\n`;
      readme += `${inferClassPurpose(cls.name)}.\n\n`;

      if (cls.extends) {
        readme += `**Extends:** \`${cls.extends}\`\n\n`;
      }

      if (cls.methods.length > 0) {
        readme += '**Methods:**\n\n';
        readme += '| Method | Parameters | Async |\n';
        readme += '|--------|------------|-------|\n';

        cls.methods.forEach(method => {
          const params = method.params.map(p => `\`${p.replace(/[=:].*/g, '').trim()}\``).join(', ') || '-';
          readme += `| \`${method.name}()\` | ${params} | ${method.isAsync ? '✓' : '-'} |\n`;
        });
        readme += '\n';
      }

      readme += '---\n\n';
    });
  }

  // Document standalone functions
  const standaloneFuncs = functions.filter(f => !f.className);
  if (standaloneFuncs.length > 0) {
    readme += '## Functions\n\n';

    standaloneFuncs.forEach(func => {
      readme += `### \`${func.name}(${func.params.map(p => p.replace(/[=:].*/g, '').trim()).join(', ')})\`\n\n`;
      readme += `${inferPurpose(func.name, func.body)}.\n\n`;

      if (func.params.length > 0) {
        readme += '**Parameters:**\n\n';
        func.params.forEach(p => {
          const clean = p.replace(/[=:].*/g, '').trim();
          if (clean) {
            readme += `- \`${clean}\` *(${inferType(clean)})* - ${inferParamDescription(clean)}\n`;
          }
        });
        readme += '\n';
      }

      const returnType = inferReturnType(func.name, func.body, func.isAsync);
      if (returnType !== 'void') {
        const asyncPrefix = func.isAsync ? 'Promise<' : '';
        const asyncSuffix = func.isAsync ? '>' : '';
        readme += `**Returns:** \`${asyncPrefix}${returnType}${asyncSuffix}\` - ${inferReturnDescription(func.name, returnType)}\n\n`;
      }

      readme += '---\n\n';
    });
  }

  return readme;
}

module.exports = { generateDocumentation };
