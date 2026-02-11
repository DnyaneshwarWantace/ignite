import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/options';
import { callLLM } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    const { prompt, count } = await request.json();

    const aiResponse = await callLLM(userId, [
      {
        role: 'system',
        content: 'You are a top-tier direct response copywriter trained in the principles of Sabri Suby, Dan Kennedy, and Russell Brunson.'
      },
      { role: 'user', content: prompt }
    ], { max_tokens: 1000, temperature: 0.7 });

    // Parse the numbered list response from AI
    const lines = aiResponse.split('\n').filter((line: string) => line.trim());
    const variations = lines
      .map((line: string) => {
        let cleaned = line.replace(/^\d+\.\s*/, '').trim();
        cleaned = cleaned.replace(/^(Enhanced headline:|Headline:|Variation:|Text:)\s*/i, '');
        cleaned = cleaned.replace(/^["""']\s*/, '').replace(/\s*["""']$/, '');
        return cleaned;
      })
      .filter((variation: string) => variation.length > 0)
      .slice(0, count);

    return NextResponse.json({ variations });
  } catch (error: unknown) {
    console.error('LLM API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
