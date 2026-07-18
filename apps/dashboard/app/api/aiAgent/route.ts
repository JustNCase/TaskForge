import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ reply: 'AI assistant is not configured.', suggestedAction: 'general' });

    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are TaskForge AI, a helpful task management assistant. Respond concisely. Respond in JSON: { reply, suggestedAction }.' },
        { role: 'user', content: message },
      ],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ reply: 'Sorry, I had trouble processing that.', suggestedAction: 'general' });
  }
}
