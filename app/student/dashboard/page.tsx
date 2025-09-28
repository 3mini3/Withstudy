import type { SubjectId } from '../../../lib/studentContext';
import { SUBJECT_LABELS } from '../../../lib/studentContext';
import prisma from '../../../lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface SubjectSummary {
  subject: string;
  label: string;
  sessions: number;
  userMessages: number;
  assistantMessages: number;
  totalTokens: number;
  totalDurationMinutes: number;
}

function getSessionEmail(): string | null {
  const sessionCookie = cookies().get('withstady-session');
  if (!sessionCookie?.value) return null;

  try {
    const parsed = JSON.parse(sessionCookie.value) as { email?: unknown };
    if (typeof parsed?.email === 'string' && parsed.email.trim()) {
      return parsed.email.trim().toLowerCase();
    }
  } catch (error) {
    return null;
  }

  return null;
}

function summarizeSubjects(metrics: SubjectSummary[]): SubjectSummary[] {
  return metrics.sort((a, b) => b.sessions - a.sessions || b.userMessages - a.userMessages);
}

export default async function StudentDashboardPage() {
  const email = getSessionEmail();

  if (!email) {
    redirect('/login');
  }

  const student = await prisma.student.findUnique({
    where: { email },
    include: {
      contextDocument: true
    }
  });

  if (!student) {
    redirect('/login');
  }

  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - 6);
  rangeStart.setHours(0, 0, 0, 0);

  const dailyMetrics = await prisma.dailyStudentMetric.findMany({
    where: {
      studentEmail: email,
      summaryDate: { gte: rangeStart }
    },
    orderBy: { summaryDate: 'desc' }
  });

  const recentSessions = await prisma.chatSession.findMany({
    where: { studentEmail: email },
    orderBy: { startedAt: 'desc' },
    take: 5,
    include: {
      _count: { select: { messages: true } }
    }
  });

  const totals = dailyMetrics.reduce(
    (acc, metric) => {
      acc.sessions += metric.sessionsCount;
      acc.userMessages += metric.userMessagesCount;
      acc.assistantMessages += metric.assistantMessagesCount;
      acc.tokens += metric.totalTokenEstimate ?? 0;
      acc.durationSeconds += metric.totalDurationSeconds;
      return acc;
    },
    { sessions: 0, userMessages: 0, assistantMessages: 0, tokens: 0, durationSeconds: 0 }
  );

  const subjectMap = new Map<SubjectId | string, SubjectSummary>();

  for (const metric of dailyMetrics) {
    const subject = metric.subject as SubjectId | string;
    const existing = subjectMap.get(subject) ?? {
      subject,
      label: SUBJECT_LABELS[subject as SubjectId] ?? subject,
      sessions: 0,
      userMessages: 0,
      assistantMessages: 0,
      totalTokens: 0,
      totalDurationMinutes: 0
    };

    existing.sessions += metric.sessionsCount;
    existing.userMessages += metric.userMessagesCount;
    existing.assistantMessages += metric.assistantMessagesCount;
    existing.totalTokens += metric.totalTokenEstimate ?? 0;
    existing.totalDurationMinutes += Math.round(metric.totalDurationSeconds / 60);

    subjectMap.set(subject, existing);
  }

  const subjectSummaries = summarizeSubjects(Array.from(subjectMap.values()));

  const formatter = new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  const lastUpdated = dailyMetrics[0]?.summaryDate ?? null;

  return (
    <section className="student-dashboard">
      <header className="student-dashboard-hero">
        <div>
          <h2>学習ダッシュボード</h2>
          <p>
            直近7日間の進捗を確認し、チャットでの学習状況を振り返りましょう。
            {lastUpdated ? ` 最新記録: ${lastUpdated.toLocaleDateString('ja-JP')}` : ''}
          </p>
        </div>
      </header>

      <section className="student-metrics-grid" aria-label="学習サマリー">
        <article className="metric-card">
          <h3>セッション数</h3>
          <p className="metric-card-value">{totals.sessions}</p>
          <p className="metric-card-caption">直近7日間に開いた学習セッション</p>
        </article>
        <article className="metric-card">
          <h3>ユーザー発話</h3>
          <p className="metric-card-value">{totals.userMessages}</p>
          <p className="metric-card-caption">あなたが送信したメッセージ数</p>
        </article>
        <article className="metric-card">
          <h3>チューター発話</h3>
          <p className="metric-card-value">{totals.assistantMessages}</p>
          <p className="metric-card-caption">AI チューターからの回答数</p>
        </article>
        <article className="metric-card">
          <h3>学習時間</h3>
          <p className="metric-card-value">{Math.round(totals.durationSeconds / 60)}分</p>
          <p className="metric-card-caption">セッション継続時間の概算</p>
        </article>
      </section>

      <section className="student-subject-table" aria-label="教科別サマリー">
        <h3>教科別の進捗</h3>
        {subjectSummaries.length === 0 ? (
          <p className="empty-state">まだ学習記録がありません。チャットを開始して記録を作りましょう。</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th scope="col">教科</th>
                <th scope="col">セッション</th>
                <th scope="col">ユーザー発話</th>
                <th scope="col">チューター発話</th>
                <th scope="col">推定トークン</th>
                <th scope="col">学習時間 (分)</th>
              </tr>
            </thead>
            <tbody>
              {subjectSummaries.map((summary) => (
                <tr key={summary.subject}>
                  <th scope="row">{summary.label}</th>
                  <td>{summary.sessions}</td>
                  <td>{summary.userMessages}</td>
                  <td>{summary.assistantMessages}</td>
                  <td>{summary.totalTokens}</td>
                  <td>{summary.totalDurationMinutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="student-recent-sessions" aria-label="最近の学習セッション">
        <h3>最近のセッション</h3>
        {recentSessions.length === 0 ? (
          <p className="empty-state">まだ記録がありません。チャットを始めて最初のセッションを作成しましょう。</p>
        ) : (
          <ul>
            {recentSessions.map((session) => (
              <li key={session.id}>
                <div>
                  <p className="session-title">{SUBJECT_LABELS[session.subject as SubjectId] ?? session.subject}</p>
                  <p className="session-meta">
                    {formatter.format(session.startedAt)} ・ {session._count.messages} メッセージ
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
