import OpenAI from 'openai';
import { readFileSync, writeFileSync } from 'fs';
import { MODEL, FILES } from './config';
import { analyzeText, formatBytes } from './stats';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function formatPrice(price: number): string {
  return `$${price.toFixed(4)}`;
}

async function summarizeContent() {
  try {
    const startTime = Date.now();
    
    // Read the content from input file
    const content = readFileSync(FILES.INPUT, 'utf-8');
    
    // Load model specifications and analyze content
    const models = JSON.parse(readFileSync(FILES.MODELS, 'utf-8'));
    const modelSpec = models[MODEL];
    const stats = analyzeText(content, modelSpec);

    console.log('\nContent Analysis:');
    console.log('='.repeat(50));
    console.log(`Model: ${modelSpec.name} (${MODEL})`);
    console.log(`Price per 1M tokens:`);
    console.log(`- Input: $${modelSpec.pricing.inputPrice}`);
    console.log(`- Output: $${modelSpec.pricing.outputPrice}`);
    console.log(`- Cached Input: $${modelSpec.pricing.cachedInputPrice}`);
    console.log('\nText Statistics:');
    console.log(`Words: ${stats.words.toLocaleString()}`);
    console.log(`Characters: ${stats.characters.toLocaleString()}`);
    console.log(`Estimated Tokens: ${stats.estimatedTokens.toLocaleString()}`);
    console.log(`Context Window Utilization: ${stats.contextUtilization.toFixed(2)}%`);
    console.log(`Total Size: ${formatBytes(stats.totalSize)}`);

    // Create the prompt
    const prompt = `Please provide a concise summary of the following content in markdown format:

${content}

Please format your response in markdown.`;

    console.log('\nGenerating Summary...');
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Get the response
    const summary = completion.choices[0].message.content;
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // Convert to seconds

    // Save the result to output file
    writeFileSync(FILES.OUTPUT, summary || 'No summary generated.');

    // Calculate costs
    const inputTokens = stats.estimatedTokens;
    const outputTokens = Math.ceil((summary?.length || 0) / 4); // Using same 4 chars/token ratio
    const inputCost = (inputTokens / 1_000_000) * modelSpec.pricing.inputPrice;
    const outputCost = (outputTokens / 1_000_000) * modelSpec.pricing.outputPrice;
    const totalCost = inputCost + outputCost;

    console.log('\nSummary Statistics:');
    console.log('='.repeat(50));
    console.log(`Time taken: ${duration.toFixed(2)} seconds`);
    console.log(`Summary saved to: ${FILES.OUTPUT}`);
    console.log(`Summary length: ${summary?.length.toLocaleString()} characters`);
    console.log(`Summary tokens: ~${outputTokens.toLocaleString()}`);
    console.log(`Summary size: ${formatBytes((summary?.length || 0) * 2)}`);
    console.log('\nCost Analysis:');
    console.log(`Input cost (${inputTokens.toLocaleString()} tokens): ${formatPrice(inputCost)}`);
    console.log(`Output cost (${outputTokens.toLocaleString()} tokens): ${formatPrice(outputCost)}`);
    console.log(`Total cost: ${formatPrice(totalCost)}`);
    
    // Analyze summary stats
    const summaryStats = analyzeText(summary || '', modelSpec);
    console.log(`Summary tokens: ${summaryStats.estimatedTokens.toLocaleString()}`);
    console.log(`Summary size: ${formatBytes(summaryStats.totalSize)}`);
    
    // Calculate compression ratio
    const compressionRatio = (1 - (summaryStats.totalSize / stats.totalSize)) * 100;
    console.log(`\nCompression Ratio: ${compressionRatio.toFixed(1)}%`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the summarization
summarizeContent();