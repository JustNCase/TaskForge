import OpenAI from 'openai';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;

  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not set');
  client = new OpenAI({ apiKey: key });
  return client;
}

export type AIAgentRequest = {
  userId: string;
  message: string;
};

export type AIAgentResponse = {
  reply: string;
  suggestedAction?: string;
};

export async function runTaskForgeAgent(
  request: AIAgentRequest
): Promise<AIAgentResponse> {
  const openai = getClient();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are TaskForge AI, a helpful task management assistant. Help users organize, prioritize, and break down their tasks. Keep responses concise and actionable. If the user wants to create a task, suggest "create_task". If they want to list tasks, suggest "list_tasks". If they want help prioritizing, suggest "prioritize". Otherwise suggest "general". Respond in JSON format with keys: reply (string), suggestedAction (string).',
      },
      {
        role: 'user',
        content: request.message,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(raw);

  return {
    reply: parsed.reply || 'I understand your request. Can you provide more details?',
    suggestedAction: parsed.suggestedAction || 'general',
  };
}
