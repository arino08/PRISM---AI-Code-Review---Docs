const weaviateBase = require('weaviate-ts-client');
const weaviate = weaviateBase.default || weaviateBase;

// Helper to get client with auth
function getClient(apiKey) {
    return weaviate.client({
        scheme: 'http',
        host: process.env.WEAVIATE_HOST || 'localhost:8080',
        headers: { 'X-OpenAI-Api-Key': apiKey || process.env.OPENAI_API_KEY || '' }
    });
}

const CLASS_NAME = 'CodeSnippet';

async function semanticSearch(query, apiKey, limit = 10) {
    if (!query) throw new Error("Query required");

    const client = getClient(apiKey);

    try {
        // Check for explicit filename mentions (e.g. "main.rs", "app.tsx")
        const filenameMatch = query.match(/\b[\w-]+\.\w+\b/);
        let searchBuilder = client.graphql.get()
          .withClassName(CLASS_NAME)
          .withFields('code filename language startLine endLine _additional { certainty }')
          .withNearText({ concepts: [query] })
          .withLimit(limit);

        // If filename detected, boost it using a filter (Hybrid search simulation)
        if (filenameMatch) {
           const filename = filenameMatch[0];
           console.log(`Detected filename in query: ${filename}`);

           // Parallel fetch: Semantic Search + File Search
           const [semanticResults, fileResults] = await Promise.all([
               searchBuilder.do(),
               client.graphql.get()
                .withClassName(CLASS_NAME)
                .withFields('code filename language startLine endLine _additional { certainty }')
                .withWhere({
                    path: ['filename'],
                    operator: 'Like',
                    valueText: `*${filename}*`
                })
                .withLimit(3)
                .do()
           ]);

           const semanticData = semanticResults.data.Get[CLASS_NAME] || [];
           const fileData = fileResults.data.Get[CLASS_NAME] || [];

           // Deduplicate by code content or reference
           const allResults = [...fileData, ...semanticData];
           const unique = [];
           const seen = new Set();

           for (const item of allResults) {
               const id = item.filename + item.startLine;
               if (!seen.has(id)) {
                   seen.add(id);
                   unique.push(item);
               }
           }
           // Map to desired output format
           return unique.slice(0, limit + 3).map(item => ({
                code: item.code,
                filename: item.filename,
                line: item.startLine
            }));
        }

        // Standard Semantic Search (if no filename match)
        const result = await searchBuilder.do();
        const data = result.data.Get[CLASS_NAME];
        if (!data) return [];

        return data.map(item => ({
            code: item.code,
            filename: item.filename,
            line: item.startLine
        }));
    } catch (err) {
        console.error("Semantic Search Error:", err);
        return [];
    }
}

module.exports = { semanticSearch };
