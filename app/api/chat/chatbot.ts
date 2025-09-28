import Groq from 'groq-sdk';

type TutorRole = 'system' | 'user' | 'assistant';

export interface TutorHistoryMessage {
  role: TutorRole;
  content: string;
}

export interface GenerateTutorReplyParams {
  prompt: string;
  history?: TutorHistoryMessage[];
  context?: string | null;
}

export interface TutorUsage {
  total_tokens?: number;
  completion_tokens?: number;
  [key: string]: unknown;
}

export interface TutorReply {
  message: string;
  usage: TutorUsage | null;
}

const DEFAULT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const BASE_SYSTEM_PROMPT =
  process.env.GROQ_SYSTEM_PROMPT ||
  'You are a patient and encouraging homework tutor. Provide clear, step-by-step explanations. If unsure, say so and suggest how the student can verify.';

export function isTutorHistoryMessage(value: unknown): value is TutorHistoryMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const message = value as Partial<TutorHistoryMessage>;
  return (
    typeof message.content === 'string' &&
    message.content.trim().length > 0 &&
    message.role !== undefined &&
    (message.role === 'system' || message.role === 'user' || message.role === 'assistant')
  );
}

export async function generateTutorReply({
  prompt,
  history = [],
  context
}: GenerateTutorReplyParams): Promise<TutorReply> {
  const trimmedPrompt = prompt?.trim();

  if (!trimmedPrompt) {
    throw new Error('Prompt is required for the tutor to respond.');
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  const groq = new Groq({ apiKey });

  const normalizedHistory: TutorHistoryMessage[] = Array.isArray(history)
    ? history.filter(isTutorHistoryMessage).map(({ role, content }) => ({ role, content }))
    : [];

  const systemPrompt = context
    ? `${BASE_SYSTEM_PROMPT}\n\n${context.trim()}`
    : BASE_SYSTEM_PROMPT;

  const messages: TutorHistoryMessage[] = [
    { role: 'system', content: systemPrompt },
    ...normalizedHistory,
    { role: 'user', content: trimmedPrompt }
  ];

  const completion = await groq.chat.completions.create({
    model: DEFAULT_MODEL,
    messages,
    temperature: 0.3,
    max_tokens: 800,
    stream: false
  });

  const messageContent = completion?.choices?.[0]?.message?.content?.trim() || '';

  return {
    message: messageContent,
    usage: (completion?.usage as TutorUsage) || null
  };
}
