const weaviateBase = require('weaviate-ts-client');
const weaviate = weaviateBase.default || weaviateBase;
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { OpenAIEmbeddings } = require('@langchain/openai');
const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');
const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');

const execAsync = promisify(exec);



// Helper to get client with auth
function getClient(apiKey) {
    return weaviate.client({
        scheme: 'http',
        host: process.env.WEAVIATE_HOST || 'localhost:8080',
        headers: { 'X-OpenAI-Api-Key': apiKey || process.env.OPENAI_API_KEY || '' }
    });
}

const CLASS_NAME = 'CodeSnippet';

async function initSchema(apiKey) {
  const client = getClient(apiKey);
  //Check if class exists
  try {
    // RESET SCHEMA: Delete existing class to ensure fresh schema (fixes tokenization issues)
    const schema = await client.schema.getter().do();
    const classExists = schema.classes.some(c => c.class === CLASS_NAME);

    if (classExists) {
        console.log(`Resetting schema for ${CLASS_NAME}...`);
        await client.schema.classDeleter().withClassName(CLASS_NAME).do();
    }

    // Create fresh class
    const classObj = {
        class: CLASS_NAME,
        vectorizer: 'text2vec-openai',
        moduleConfig: {
            'text2vec-openai': {
                model: 'ada',
                modelVersion: '002',
                type: 'text'
            }
        },
        properties: [
            { name: 'code', dataType: ['text'] },
            { name: 'filename', dataType: ['string'], tokenization: 'field' }, // Ensure full string match
            { name: 'language', dataType: ['string'] },
            { name: 'startLine', dataType: ['int'] },
            { name: 'endLine', dataType: ['int'] }
        ]
    };
    await client.schema.classCreator().withClass(classObj).do();
    console.log(`Created Schema: ${CLASS_NAME}`);

  } catch (err) {
      console.error("Weaviate Schema Error:", err);
  }
}

// Clone a GitHub repo to temp directory
async function cloneRepo(repoUrl) {
    const tempDir = path.join(os.tmpdir(), `rag-repo-${Date.now()}`);
    console.log(`Cloning ${repoUrl} to ${tempDir}...`);

    try {
        await execAsync(`git clone --depth 1 ${repoUrl} ${tempDir}`);
        return tempDir;
    } catch (err) {
        throw new Error(`Failed to clone repository: ${err.message}`);
    }
}

// Check if input is a GitHub URL
function isGitHubUrl(input) {
    return input.startsWith('https://github.com/') || input.startsWith('git@github.com:');
}

async function ingestRepo(repoInput, apiKey) {
    if (!apiKey) throw new Error("API Key required for RAG ingestion");

    // Initialize Schema if needed (pass key)
    await initSchema(apiKey);

    const client = getClient(apiKey);
    let repoPath = repoInput;
    let shouldCleanup = false;

    // Handle GitHub URLs
    if (isGitHubUrl(repoInput)) {
        repoPath = await cloneRepo(repoInput);
        shouldCleanup = true;
    }

    try {
    // 1. Get all files - Production-ready language support
    const supportedExtensions = [
        // JavaScript/TypeScript
        'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
        // Python
        'py', 'pyi', 'pyx',
        // Rust
        'rs',
        // Go
        'go',
        // Java/Kotlin/Scala
        'java', 'kt', 'kts', 'scala',
        // C/C++
        'c', 'cpp', 'cc', 'cxx', 'h', 'hpp', 'hxx',
        // C#/F#
        'cs', 'fs',
        // Ruby
        'rb', 'rake',
        // PHP
        'php',
        // Swift
        'swift',
        // Shell
        'sh', 'bash', 'zsh',
        // Web
        'html', 'htm', 'css', 'scss', 'sass', 'less', 'vue', 'svelte',
        // Data/Config
        'json', 'yaml', 'yml', 'toml', 'xml', 'ini', 'env',
        // Docs
        'md', 'mdx', 'rst', 'txt',
        // Database
        'sql', 'prisma', 'graphql', 'gql',
        // Other
        'lua', 'pl', 'pm', 'ex', 'exs', 'erl', 'hrl', 'zig', 'nim', 'v', 'dart', 'r'
    ];

    const files = await glob(`**/*.{${supportedExtensions.join(',')}}`, {
        cwd: repoPath,
        ignore: [
            '**/node_modules/**',
            '**/.git/**',
            '**/dist/**',
            '**/build/**',
            '**/.next/**',
            '**/target/**',      // Rust
            '**/__pycache__/**', // Python
            '**/.venv/**',       // Python virtual env
            '**/venv/**',
            '**/*.min.js',       // Minified files
            '**/*.min.css',
            '**/package-lock.json',
            '**/yarn.lock',
            '**/Cargo.lock',
            '**/poetry.lock',
            '**/Gemfile.lock'
        ],
        absolute: true
    });

    console.log(`Found ${files.length} files to ingest.`);

    // 2. Process Files & Chunk
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
        separators: ["\nfunction", "\nclass", "\n//", "\n"]
    });

    const batcher = client.batch.objectsBatcher();
    let batchSize = 0;
    const MAX_BATCH = 50;

    for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const relativePath = path.relative(repoPath, file);

        // Chunking
        const docs = await textSplitter.createDocuments([content], { filename: relativePath });

        for (const doc of docs) {
            const startLine = 1; // Simplification: actual line tracking needs more robust parsing

            // Add to Batch
            batcher.withObject({
                class: CLASS_NAME,
                properties: {
                    code: doc.pageContent,
                    filename: relativePath,
                    language: path.extname(file).substring(1),
                    startLine: startLine
                }
            });

            batchSize++;
            if (batchSize >= MAX_BATCH) {
                await batcher.do();
                batchSize = 0;
                console.log(`Flushed batch into Weaviate...`);
            }
        }
    }

    if (batchSize > 0) {
        await batcher.do();
    }

    return { success: true, filesProcessed: files.length };
    } finally {
        // Cleanup: remove cloned repo if we created one
        if (shouldCleanup && repoPath) {
            try {
                await fs.rm(repoPath, { recursive: true, force: true });
                console.log(`Cleaned up temp directory: ${repoPath}`);
            } catch (cleanupErr) {
                console.warn(`Failed to cleanup temp dir: ${cleanupErr.message}`);
            }
        }
    }
}

module.exports = { ingestRepo };
