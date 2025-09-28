import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { ensureStudentContextDocument, SUBJECT_LABELS } from '../../../lib/studentContext';
import type { SubjectId } from '../../../lib/studentContext';
import {
  generateTutorReply,
  isTutorHistoryMessage,
  type TutorHistoryMessage,
  type TutorUsage
} from './chatbot';

const SUBJECT_OPTIONS = new Set<SubjectId>(Object.keys(SUBJECT_LABELS) as SubjectId[]);

interface ChatPayload {
  prompt?: unknown;
  history?: unknown;
  context?: unknown;
  subject?: unknown;
}

export async function POST(request: NextRequest) {
  let payload: ChatPayload;

  try {
    payload = (await request.json()) as ChatPayload;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const prompt = typeof payload.prompt === 'string' ? payload.prompt : '';
  const historyInput = Array.isArray(payload.history) ? payload.history : [];
  const context = typeof payload.context === 'string' ? payload.context : undefined;
  const subject = typeof payload.subject === 'string' ? payload.subject : '';

  if (!prompt.trim()) {
    return NextResponse.json({ error: 'Provide a prompt for the tutor.' }, { status: 400 });
  }

  if (!subject || !SUBJECT_OPTIONS.has(subject as SubjectId)) {
    return NextResponse.json({ error: 'A valid subject identifier is required.' }, { status: 400 });
  }

  const sessionCookie = cookies().get('withstady-session');
  if (!sessionCookie?.value) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let email = '';
  try {
    const parsed = JSON.parse(sessionCookie.value) as { email?: unknown };
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

  const dailyUpdateBase: Parameters<typeof prisma.dailyStudentMetric.upsert>[0]['update'] = {
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
    const historyMessages = historyInput.filter(isTutorHistoryMessage) as TutorHistoryMessage[];
    const combinedContext = [personalizedContext, context]
      .filter((segment): segment is string => typeof segment === 'string' && segment.trim().length > 0)
      .join('\n\n');

    const { message: reply, usage } = await generateTutorReply({
      prompt,
      history: historyMessages,
      context: combinedContext || null
    });

    if (!reply) {
      return NextResponse.json(
        {
          error: 'Groq API returned an empty response.'
        },
        { status: 502 }
      );
    }

    const usageMetrics = usage as TutorUsage | null;
    const tokenEstimate =
      typeof usageMetrics?.total_tokens === 'number'
        ? usageMetrics.total_tokens
        : typeof usageMetrics?.completion_tokens === 'number'
        ? usageMetrics.completion_tokens
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

    const durationIncrementData: Parameters<typeof prisma.dailyStudentMetric.update>[0]['data'] = {
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
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error while contacting Groq.';

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
