'use client';

import { useState } from 'react';

const initialMessages = [
  {
    role: 'assistant',
    content:
      "Hi there! I'm your study companion. Ask me about your homework and we'll work through it together."
  }
];

const INITIAL_ASSISTANT_INDEX = 0;

export default function HomePage() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || isLoading) return;

    const userMessage = { role: 'user', content: prompt };

    const history = messages
      .filter((message, index) => !(index === INITIAL_ASSISTANT_INDEX && message.role === 'assistant'))
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
        body: JSON.stringify({ prompt, history })
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

      setMessages([...nextMessages, assistantMessage]);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="chat-panel">
        <header className="chat-header">
          <h1>Withstady Tutor</h1>
          <p>Ask your question and keep track of the entire conversation.</p>
        </header>

        <div className="chat-history" aria-live="polite">
          {messages.map((message, index) => (
            <article
              key={`${message.role}-${index}`}
              className={`chat-bubble ${message.role}`}
            >
              <span className="chat-role">{message.role === 'user' ? 'You' : 'Tutor'}</span>
              <p>{message.content}</p>
            </article>
          ))}
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <label className="chat-label" htmlFor="question-input">
            Ask a homework question
          </label>
          <div className="chat-controls">
            <textarea
              id="question-input"
              name="question"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="e.g. How do I explain photosynthesis in simple terms?"
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
