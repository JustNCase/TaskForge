import OpenAI from 'openai';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  client = new OpenAI({ apiKey: key });
  return client;
}

export type AIRequest = {
  prompt: string;
};

export type AIResponse = {
  title: string;
  description: string;
  difficulty: number;
  subtasks: { title: string; description: string }[];
};

export async function createAITask(request: AIRequest): Promise<AIResponse> {
  const openai = getClient();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a task breakdown assistant. Given a user prompt, generate a task with a title, description, difficulty (1-10), and up to 5 subtasks. Respond in JSON format with keys: title, description, difficulty, subtasks (array of {title, description}).',
      },
      {
        role: 'user',
        content: request.prompt,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(raw);

  return {
    title: parsed.title || request.prompt,
    description: parsed.description || '',
    difficulty: Math.min(10, Math.max(1, parsed.difficulty || 1)),
    subtasks: (parsed.subtasks || []).slice(0, 5),
  };
}
