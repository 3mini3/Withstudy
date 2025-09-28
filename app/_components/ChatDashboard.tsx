'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { SubjectId } from '../../lib/studentContext';
import { getSubjectConfig, SUBJECT_CONFIGS, type SubjectConfig } from '../../lib/subjects';

interface ChatMessage {
  role: ChatMessageRole;
  content: string;
}

type ChatMessageRole = 'assistant' | 'user';

interface ChatApiResponse {
  message?: string;
  error?: string;
}

type StudentProfile = {
  email: string;
  grade: number | null;
  favoriteSubject: string | null;
  mockExamScore: number | null;
};

interface ChatDashboardProps {
  student: StudentProfile;
  subjectId: SubjectId;
}

function buildInitialAssistantMessage(subject: SubjectConfig): string {
  return `${subject.label}の質問をどうぞ。分かりやすく一緒に解決していきましょう。`;
}

export default function ChatDashboard({ student: _student, subjectId }: ChatDashboardProps) {
  const subjectConfig = useMemo(
    () => getSubjectConfig(subjectId) ?? SUBJECT_CONFIGS[0],
    [subjectId]
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      role: 'assistant',
      content: buildInitialAssistantMessage(subjectConfig)
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: buildInitialAssistantMessage(subjectConfig)
      }
    ]);
    setInput('');
    setError('');
  }, [subjectConfig]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: prompt };

    const history = messages
      .filter((message, index) => !(index === 0 && message.role === 'assistant'))
      .map(({ role, content }) => ({ role, content }));

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          history,
          context: subjectConfig.context,
          subject: subjectConfig.id
        })
      });

      const data = (await response.json()) as ChatApiResponse;

      if (!response.ok) {
        throw new Error(data?.error || 'The tutor is unavailable right now.');
      }

      const assistantContent = data?.message?.trim();
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: assistantContent || 'I ran into an issue generating a response—please try again.'
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Something went wrong.');
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="chat-panel">
      <header className="chat-header">
        <div>
          <h1>{subjectConfig.label} チューター</h1>
          <p>{subjectConfig.description}</p>
        </div>
      </header>

      <div className="chat-history" role="log" aria-live="polite">
        {messages.map((message, index) => (
          <article key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
            <p>{message.content}</p>
          </article>
        ))}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <label className="chat-label" htmlFor="chat-prompt">
          {subjectConfig.label}の質問を入力
        </label>
        <div className="chat-controls">
          <textarea
            id="chat-prompt"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={`${subjectConfig.label}の質問を書いてください。`}
            rows={3}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? '送信中…' : '送信'}
          </button>
        </div>
        {error ? <p className="chat-error">{error}</p> : null}
      </form>
    </section>
  );
}
