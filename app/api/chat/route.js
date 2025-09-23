import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { ensureStudentContextDocument } from '../../../lib/studentContext';
import { generateTutorReply } from './chatbot';

const SUBJECT_OPTIONS = new Set(['math', 'science', 'english', 'social-studies', 'japanese']);

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const { prompt, history = [], context, subject } = payload || {};

  if (typeof prompt !== 'string' || !prompt.trim()) {
    return NextResponse.json({ error: 'Provide a prompt for the tutor.' }, { status: 400 });
  }

  if (!subject || !SUBJECT_OPTIONS.has(subject)) {
    return NextResponse.json({ error: 'A valid subject identifier is required.' }, { status: 400 });
  }

  const sessionCookie = cookies().get('withstady-session');
  if (!sessionCookie?.value) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let email = '';
  try {
    const parsed = JSON.parse(sessionCookie.value);
    if (typeof parsed?.email === 'string' && parsed.email.trim()) {
      email = parsed.email.trim().toLowerCase();
    }
  } catch (error) {
    console.error('Failed to parse session cookie', error);
  }

  if (!email) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const student = await prisma.student.findUnique({
    where: { email },
    include: { contextDocument: true }
  });

  if (!student) {
    return NextResponse.json({ error: 'Student not found.' }, { status: 401 });
  }

  const personalizedContext = await ensureStudentContextDocument(student);

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const summaryDate = startOfDay;

  let chatSession = await prisma.chatSession.findFirst({
    where: {
      studentEmail: email,
      subject,
      startedAt: { gte: startOfDay }
    },
    orderBy: { startedAt: 'desc' }
  });

  let createdNewSession = false;

  if (!chatSession) {
    chatSession = await prisma.chatSession.create({
      data: {
        studentEmail: email,
        subject,
        startedAt: now
      }
    });
    createdNewSession = true;
  }

  await prisma.chatMessage.create({
    data: {
      sessionId: chatSession.id,
      role: 'user',
      content: prompt.trim()
    }
  });

  const dailyUpdateBase = {
    userMessagesCount: { increment: 1 },
    lastCalculatedAt: new Date()
  };

  if (createdNewSession) {
    dailyUpdateBase.sessionsCount = { increment: 1 };
  }

  await prisma.dailyStudentMetric.upsert({
    where: {
      studentEmail_subject_summaryDate: {
        studentEmail: email,
        subject,
        summaryDate
      }
    },
    create: {
      studentEmail: email,
      subject,
      summaryDate,
      sessionsCount: createdNewSession ? 1 : 0,
      userMessagesCount: 1,
      assistantMessagesCount: 0,
      totalTokenEstimate: 0,
      totalDurationSeconds: 0,
      lastCalculatedAt: new Date()
    },
    update: dailyUpdateBase
  });

  try {
    const combinedContext = [personalizedContext, context].filter(Boolean).join('\n\n');

    const { message: reply, usage } = await generateTutorReply({
      prompt,
      history,
      context: combinedContext
    });

    if (!reply) {
      return NextResponse.json(
        {
          error: 'Groq API returned an empty response.'
        },
        { status: 502 }
      );
    }

    const tokenEstimate =
      typeof usage?.total_tokens === 'number'
        ? usage.total_tokens
        : typeof usage?.completion_tokens === 'number'
        ? usage.completion_tokens
        : null;

    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'assistant',
        content: reply,
        tokensEstimated: tokenEstimate ?? undefined
      }
    });

    const previousEndedAt = chatSession.endedAt;
    const sessionStartedAt = chatSession.startedAt;
    const currentTime = new Date();

    await prisma.chatSession.update({
      where: { id: chatSession.id },
      data: { endedAt: currentTime }
    });

    const durationBase = previousEndedAt ?? sessionStartedAt;
    let incrementalDurationSeconds = 0;
    if (durationBase) {
      incrementalDurationSeconds = Math.max(
        0,
        Math.round((currentTime.getTime() - durationBase.getTime()) / 1000)
      );
    }

    const durationIncrementData = {
      assistantMessagesCount: { increment: 1 },
      totalDurationSeconds: { increment: incrementalDurationSeconds },
      lastCalculatedAt: new Date()
    };

    if (typeof tokenEstimate === 'number') {
      durationIncrementData.totalTokenEstimate = { increment: tokenEstimate };
    }

    await prisma.dailyStudentMetric.update({
      where: {
        studentEmail_subject_summaryDate: {
          studentEmail: email,
          subject,
          summaryDate
        }
      },
      data: durationIncrementData
    });

    return NextResponse.json({ message: reply });
  } catch (error) {
    const errorMessage = error?.message || 'Unexpected error while contacting Groq.';

    if (errorMessage.includes('GROQ_API_KEY')) {
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    console.error('Groq API error:', error);

    await prisma.chatSession.update({
      where: { id: chatSession.id },
      data: { endedAt: new Date() }
    });

    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }
}
