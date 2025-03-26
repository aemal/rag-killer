import { readFileSync } from 'fs';
import { MODEL } from './config';

interface ModelPricing {
    inputPrice: number;
    outputPrice: number;
    cachedInputPrice: number;
}

interface ModelSpec {
    name: string;
    contextWindow: number;
    tokensPerWord: number;
    bytesPerToken: number;
    bytesPerCharacter: number;
    description: string;
    pricing: ModelPricing;
}

interface Models {
    [key: string]: ModelSpec;
}

interface CostAnalysis {
    inputCost: number;
    outputCost: number;
    cachedInputCost: number;
    totalCost: number;
}

function calculateCosts(tokens: number, pricing: ModelPricing): CostAnalysis {
    const millionTokens = tokens / 1_000_000;
    return {
        inputCost: millionTokens * pricing.inputPrice,
        outputCost: millionTokens * pricing.outputPrice,
        cachedInputCost: millionTokens * pricing.cachedInputPrice,
        totalCost: millionTokens * pricing.inputPrice // Just input cost for analysis
    };
}

export function analyzeText(content: string, modelSpec: ModelSpec) {
    // Basic text statistics
    const words = content.trim().split(/\s+/).length;
    const characters = content.length;
    const lines = content.split('\n').length;

    // Token estimation - updated to be more accurate
    // Using characters instead of words as it's more accurate
    // Average of 4 characters per token for English text
    const estimatedTokens = Math.ceil(characters / 4);

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

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatPrice(price: number): string {
    return `$${price.toFixed(4)}`;
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
        const costs = calculateCosts(stats.estimatedTokens, modelSpec.pricing);

        // Print results
        console.log(`\nAnalysis for ${modelSpec.name} (${MODEL}):`);
        console.log('='.repeat(50));
        console.log(`Model Description: ${modelSpec.description}`);
        console.log(`Context Window: ${modelSpec.contextWindow.toLocaleString()} tokens`);
        console.log('\nPricing (per 1M tokens):');
        console.log(`- Input: $${modelSpec.pricing.inputPrice}`);
        console.log(`- Output: $${modelSpec.pricing.outputPrice}`);
        console.log(`- Cached Input: $${modelSpec.pricing.cachedInputPrice}`);
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
        console.log('\nCost Analysis:');
        console.log(`- Input (${stats.estimatedTokens.toLocaleString()} tokens): ${formatPrice(costs.inputCost)}`);
        console.log(`- Cached Input: ${formatPrice(costs.cachedInputCost)}`);
        console.log(`- Potential Output Cost: ${formatPrice(costs.outputCost)}`);
        console.log(`- Total Cost (input only): ${formatPrice(costs.totalCost)}`);
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