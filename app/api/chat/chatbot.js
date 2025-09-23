import Groq from 'groq-sdk';

const DEFAULT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const DEFAULT_SYSTEM_PROMPT =
  process.env.GROQ_SYSTEM_PROMPT ||
  'You are a patient and encouraging homework tutor. Provide clear, step-by-step explanations. If unsure, say so and suggest how the student can verify.';

export async function generateTutorReply({ prompt, history = [] }) {
  const trimmedPrompt = prompt?.trim();

  if (!trimmedPrompt) {
    throw new Error('Prompt is required for the tutor to respond.');
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  const groq = new Groq({ apiKey });

  const normalizedHistory = Array.isArray(history)
    ? history
        .filter(
          (message) =>
            message &&
            typeof message.content === 'string' &&
            ['system', 'user', 'assistant'].includes(message.role)
        )
        .map(({ role, content }) => ({ role, content }))
    : [];

  const messages = [
    { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
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

  return completion?.choices?.[0]?.message?.content?.trim() || '';
}
