import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, description, category } = await request.json();
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      const fallback = [
        `Research and plan ${title}`,
        `Gather required resources for ${title}`,
        `Execute the main work for ${title}`,
        `Review and test ${title}`,
        `Document and finalize ${title}`,
      ];
      return NextResponse.json({ subtasks: fallback });
    }

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Break the given task into 3-6 clear, actionable subtasks. Respond in JSON: { "subtasks": ["subtask 1", "subtask 2", ...] }`,
        },
        { role: 'user', content: `Task: ${title}\nDescription: ${description || ''}\nCategory: ${category || 'general'}` },
      ],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return NextResponse.json({ subtasks: parsed.subtasks || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to break down task' }, { status: 500 });
  }
}
