import OpenAI from 'openai';
import { readFileSync, writeFileSync } from 'fs';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function summarizeContent() {
  try {
    // Read the content from content.txt
    const content = readFileSync('content.txt', 'utf-8');

    // Create the prompt
    const prompt = `Please provide a concise summary of the following content in markdown format:

${content}

Please format your response in markdown.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Get the response
    const summary = completion.choices[0].message.content;

    // Save the result to result.md
    writeFileSync('result.md', summary || 'No summary generated.');

    console.log('Summary has been saved to result.md');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the summarization
summarizeContent();