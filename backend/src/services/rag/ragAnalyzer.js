const { semanticSearch } = require('./search');

async function askCodebase(query, apiKey) {
    if (!apiKey) throw new Error("API Key required");

    // 1. Retrieve Context
    const contextItems = await semanticSearch(query, apiKey, 10);

    // 2. Format Context
    const contextString = contextItems.map(item =>
        `File: ${item.filename} (Line ${item.line})\n\`\`\`${item.language || ''}\n${item.code}\n\`\`\``
    ).join('\n\n');

    const systemPrompt = `You are a senior codebase expert. Answer the user's question primarily using the provided Code Context.
If the answer is not in the context, say so, but check if the context contains a file list or structure that might help.
Always cite the filename when referencing code.
If asked about a specific file (e.g., "main.rs"), and it's in the context, explain it detailedly.

--- Code Context ---
${contextString || "No relevant code found."}
`;

    // 3. Call LLM
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query }
                ],
                temperature: 0.2
            })
        });

        if (!response.ok) {
             const error = await response.json();
             throw new Error(error.error?.message || 'OpenAI API Error');
        }

        const data = await response.json();
        return {
            answer: data.choices[0]?.message?.content,
            context: contextItems // Return refs for UI to show "Sources"
        };
    } catch (error) {
        console.error("RAG Chat Error:", error);
        throw error;
    }
}

module.exports = { askCodebase };
