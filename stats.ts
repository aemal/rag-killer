import { readFileSync } from 'fs';

const MODEL = "o3-mini";

interface ModelSpec {
    name: string;
    contextWindow: number;
    tokensPerWord: number;
    bytesPerToken: number;
    bytesPerCharacter: number;
    description: string;
}

interface Models {
    [key: string]: ModelSpec;
}

function analyzeText(content: string, modelSpec: ModelSpec) {
    // Basic text statistics
    const words = content.trim().split(/\s+/).length;
    const characters = content.length;
    const lines = content.split('\n').length;

    // Token estimation
    const estimatedTokens = Math.ceil(words * modelSpec.tokensPerWord);

    // Size calculations
    const characterSize = characters * modelSpec.bytesPerCharacter;
    const tokenSize = estimatedTokens * modelSpec.bytesPerToken;
    const totalSize = characterSize + tokenSize;

    // Context window utilization
    const contextUtilization = (estimatedTokens / modelSpec.contextWindow) * 100;

    // Page estimation (assuming 500 words per A4 page)
    const estimatedPages = Math.ceil(words / 500);

    return {
        words,
        characters,
        lines,
        estimatedTokens,
        characterSize,
        tokenSize,
        totalSize,
        contextUtilization,
        estimatedPages
    };
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function main() {
    try {
        // Load model specifications
        const models: Models = JSON.parse(readFileSync('models.json', 'utf-8'));
        const modelSpec = models[MODEL];

        if (!modelSpec) {
            throw new Error(`Model ${MODEL} not found in models.json`);
        }

        // Load and analyze content
        const content = readFileSync('book.txt', 'utf-8');
        const stats = analyzeText(content, modelSpec);

        // Print results
        console.log(`\nAnalysis for ${modelSpec.name}:`);
        console.log('='.repeat(50));
        console.log(`Model Description: ${modelSpec.description}`);
        console.log(`Context Window: ${modelSpec.contextWindow.toLocaleString()} tokens`);
        console.log('\nText Statistics:');
        console.log(`- Words: ${stats.words.toLocaleString()}`);
        console.log(`- Characters: ${stats.characters.toLocaleString()}`);
        console.log(`- Lines: ${stats.lines.toLocaleString()}`);
        console.log(`- Estimated Pages: ${stats.estimatedPages}`);
        console.log('\nToken Analysis:');
        console.log(`- Estimated Tokens: ${stats.estimatedTokens.toLocaleString()}`);
        console.log(`- Context Window Utilization: ${stats.contextUtilization.toFixed(2)}%`);
        console.log('\nSize Analysis:');
        console.log(`- Character Size: ${formatBytes(stats.characterSize)}`);
        console.log(`- Token Size: ${formatBytes(stats.tokenSize)}`);
        console.log(`- Total Size: ${formatBytes(stats.totalSize)}`);
        console.log('\nRecommendations:');
        if (stats.contextUtilization > 100) {
            console.log('⚠️  Warning: Content exceeds context window! Consider chunking the content.');
        } else if (stats.contextUtilization > 80) {
            console.log('⚠️  Warning: Content is close to context window limit!');
        } else {
            console.log('✅ Content fits well within context window.');
        }
    } catch (error: any) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main(); 