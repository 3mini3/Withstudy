'use client';

import { useMemo, useState } from 'react';

const SUBJECTS = [
  {
    id: 'math',
    label: '数学',
    description: '計算、方程式、図形、データの読み取りなどの質問に対応します。',
    context:
      'You are a supportive middle-school math tutor. Use clear, step-by-step reasoning, show intermediary calculations, and connect ideas to real-world contexts when helpful.'
  },
  {
    id: 'science',
    label: '理科',
    description: '生物・化学・物理・地学の基礎をわかりやすく説明します。',
    context:
      'You are a friendly middle-school science tutor. Explain scientific concepts with everyday examples, encourage curiosity, and highlight key vocabulary students should remember.'
  },
  {
    id: 'english',
    label: '英語',
    description: '英文法や読解、スピーキング練習のヒントを伝えます。',
    context:
      'You are an encouraging English tutor for Japanese middle-school students. Provide simple explanations, sample sentences, and pronunciation tips when helpful.'
  },
  {
    id: 'social-studies',
    label: '社会',
    description: '地理・歴史・公民のポイントを整理して伝えます。',
    context:
      'You are a knowledgeable social studies tutor. Summarize historical events, geography facts, and civics concepts clearly. Encourage students to think about causes and effects.'
  },
  {
    id: 'japanese',
    label: '国語',
    description: '文章読解や作文、漢字のコツを教えます。',
    context:
      'You are a thoughtful Japanese language tutor. Help students analyze passages, interpret kanji, and improve composition skills with structured guidance.'
  }
];

const INITIAL_MESSAGES_BY_SUBJECT = SUBJECTS.reduce((acc, subject) => {
  acc[subject.id] = [
    {
      role: 'assistant',
      content: `${subject.label}の質問をどうぞ。分かりやすく一緒に解決していきましょう。`
    }
  ];
  return acc;
}, {});

const INITIAL_ASSISTANT_INDEX = 0;

export default function HomePage() {
  const [messagesBySubject, setMessagesBySubject] = useState(INITIAL_MESSAGES_BY_SUBJECT);
  const [activeSubjectId, setActiveSubjectId] = useState(SUBJECTS[0].id);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const activeSubject = useMemo(
    () => SUBJECTS.find((subject) => subject.id === activeSubjectId) ?? SUBJECTS[0],
    [activeSubjectId]
  );

  const messages = messagesBySubject[activeSubject.id] ?? [];

  const handleSubjectChange = (subjectId) => {
    setActiveSubjectId(subjectId);
    setError('');
    setInput('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || isLoading) return;

    const userMessage = { role: 'user', content: prompt };

    const history = messages
      .filter((message, index) => !(index === INITIAL_ASSISTANT_INDEX && message.role === 'assistant'))
      .map(({ role, content }) => ({ role, content }));

    const nextMessages = [...messages, userMessage];

    setMessagesBySubject((prev) => ({
      ...prev,
      [activeSubject.id]: nextMessages
    }));
    setInput('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history, context: activeSubject.context })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'The tutor is unavailable right now.');
      }

      const assistantContent = data?.message?.trim();
      const assistantMessage = {
        role: 'assistant',
        content: assistantContent || 'I ran into an issue generating a response—please try again.'
      };

      setMessagesBySubject((prev) => ({
        ...prev,
        [activeSubject.id]: [...nextMessages, assistantMessage]
      }));
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setMessagesBySubject((prev) => ({
        ...prev,
        [activeSubject.id]: messages
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="chat-panel">
        <header className="chat-header">
          <h1>Withstady Tutor</h1>
          <p>5教科のタブを切り替えて、それぞれの専門チューターに質問しましょう。</p>
        </header>

        <nav className="tab-list" aria-label="教科のチューターを選択">
          {SUBJECTS.map((subject) => {
            const isActive = subject.id === activeSubject.id;
            return (
              <button
                key={subject.id}
                type="button"
                className={`tab-button${isActive ? ' active' : ''}`}
                onClick={() => handleSubjectChange(subject.id)}
                disabled={isLoading && isActive}
              >
                {subject.label}
              </button>
            );
          })}
        </nav>

        <p className="subject-description">{activeSubject.description}</p>

        <div className="chat-history" aria-live="polite">
          {messages.map((message, index) => (
            <article
              key={`${activeSubject.id}-${message.role}-${index}`}
              className={`chat-bubble ${message.role}`}
            >
              <span className="chat-role">{message.role === 'user' ? 'You' : 'Tutor'}</span>
              <p>{message.content}</p>
            </article>
          ))}
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <label className="chat-label" htmlFor="question-input">
            {activeSubject.label}の質問を入力
          </label>
          <div className="chat-controls">
            <textarea
              id="question-input"
              name="question"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="気になる問題や用語の意味を聞いてみましょう"
              rows={3}
              required
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Thinking…' : 'Send'}
            </button>
          </div>
          {error ? <p className="chat-error">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
