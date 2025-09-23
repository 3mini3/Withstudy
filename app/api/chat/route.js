import { NextResponse } from 'next/server';
import { generateTutorReply } from './chatbot';

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const { prompt, history = [], context } = payload || {};

  if (typeof prompt !== 'string' || !prompt.trim()) {
    return NextResponse.json({ error: 'Provide a prompt for the tutor.' }, { status: 400 });
  }

  try {
    const reply = await generateTutorReply({ prompt, history, context });

    if (!reply) {
      return NextResponse.json(
        {
          error: 'Groq API returned an empty response.'
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ message: reply });
  } catch (error) {
    const errorMessage = error?.message || 'Unexpected error while contacting Groq.';

    if (errorMessage.includes('GROQ_API_KEY')) {
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    console.error('Groq API error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }
}
