'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { SubjectId } from '@/lib/studentContext';
import { getSubjectConfig, SUBJECT_CONFIGS, type SubjectConfig } from '@/lib/subjects';

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

const markdownComponents: Components = {
  p: ({ children }) => <p className="whitespace-pre-wrap leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="ml-4 list-disc space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="ml-4 list-decimal space-y-1">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary underline decoration-dotted underline-offset-4 hover:text-primary/80"
    >
      {children}
    </a>
  ),
  code: ({ inline, children }) => {
    if (inline) {
      return (
        <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[0.85rem]">
          {children}
        </code>
      );
    }

    return (
      <pre className="overflow-x-auto rounded-lg bg-muted/70 p-3 font-mono text-sm">
        <code>{children}</code>
      </pre>
    );
  }
};

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

    setMessages((prev) => [...prev, userMessage]);
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
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full w-full">
      <CardHeader className="border-b bg-muted/40">
        <CardTitle>{subjectConfig.label} チューター</CardTitle>
        <CardDescription>{subjectConfig.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 py-6">
        <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border bg-muted/30 p-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={cn(
                'max-w-[80%] rounded-xl px-4 py-3 text-sm shadow-sm',
                message.role === 'assistant'
                  ? 'bg-card text-card-foreground'
                  : 'ml-auto bg-primary text-primary-foreground'
              )}
            >
              {message.role === 'assistant' ? (
                <div className="space-y-2">
                  <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              )}
            </div>
          ))}
        </div>
        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
      </CardContent>
      <CardFooter className="border-t bg-muted/40 p-4">
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
          <Textarea
            id="chat-prompt"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={`${subjectConfig.label}の質問を書いてください。`}
            rows={3}
            disabled={isLoading}
          />
          <div className="flex items-center justify-end gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '送信中…' : '送信'}
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}
