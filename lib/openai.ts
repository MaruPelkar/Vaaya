import OpenAI from 'openai';

// Initialize OpenAI client
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.warn('OPENAI_API_KEY is not set. OpenAI features will be disabled.');
}

const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

/**
 * Structure scraped content into a typed JSON object using GPT-4o
 * Uses OpenAI's structured output feature for reliable JSON generation
 */
export async function structureContent<T>(
  content: string,
  systemPrompt: string,
  jsonSchema: Record<string, unknown>,
  options?: {
    model?: string;
    maxTokens?: number;
  }
): Promise<T | null> {
  if (!openai) {
    console.error('OpenAI client not initialized');
    return null;
  }

  try {
    const response = await openai.chat.completions.create({
      model: options?.model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'extracted_data',
          schema: jsonSchema,
          strict: true,
        },
      },
      max_tokens: options?.maxTokens || 4000,
      temperature: 0.1, // Low temperature for consistent extraction
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      console.error('Empty response from OpenAI');
      return null;
    }

    return JSON.parse(responseContent) as T;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('OpenAI structureContent error:', errorMessage);
    return null;
  }
}

/**
 * Generate a text summary or analysis using GPT-4o
 */
export async function generateText(
  prompt: string,
  systemPrompt?: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string | null> {
  if (!openai) {
    console.error('OpenAI client not initialized');
    return null;
  }

  try {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await openai.chat.completions.create({
      model: options?.model || 'gpt-4o',
      messages,
      max_tokens: options?.maxTokens || 1000,
      temperature: options?.temperature ?? 0.7,
    });

    return response.choices[0]?.message?.content || null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('OpenAI generateText error:', errorMessage);
    return null;
  }
}

/**
 * Search the web using OpenAI's web search capability (if available)
 * Falls back to generating content based on knowledge
 */
export async function searchAndAnalyze<T>(
  query: string,
  analysisPrompt: string,
  jsonSchema: Record<string, unknown>
): Promise<T | null> {
  if (!openai) {
    console.error('OpenAI client not initialized');
    return null;
  }

  try {
    // First, try to get information using the chat API with web context
    const searchPrompt = `Search for recent information about: ${query}

${analysisPrompt}

Provide factual information only. If you don't have recent information, say so.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a research assistant gathering information about companies and products. Be factual and cite sources when possible.',
        },
        { role: 'user', content: searchPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      return null;
    }

    // Structure the response into JSON
    return await structureContent<T>(
      textContent,
      'Convert the following research into the specified JSON format. Be factual and only include information explicitly mentioned.',
      jsonSchema
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('OpenAI searchAndAnalyze error:', errorMessage);
    return null;
  }
}

/**
 * Batch process multiple items with structured output
 */
export async function batchStructure<T>(
  items: Array<{ content: string; context?: string }>,
  systemPrompt: string,
  jsonSchema: Record<string, unknown>,
  options?: {
    batchSize?: number;
  }
): Promise<Array<T | null>> {
  const batchSize = options?.batchSize || 5;
  const results: Array<T | null> = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const promises = batch.map((item) => {
      const fullContent = item.context
        ? `Context: ${item.context}\n\nContent:\n${item.content}`
        : item.content;
      return structureContent<T>(fullContent, systemPrompt, jsonSchema);
    });

    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
  }

  return results;
}

export { openai };
