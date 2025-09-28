import type { SubjectId } from '@/lib/studentContext';
import { SUBJECT_LABELS } from '@/lib/studentContext';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

  const metricCards = [
    {
      title: 'セッション数',
      value: totals.sessions.toLocaleString('ja-JP'),
      description: '直近7日間に開いた学習セッション'
    },
    {
      title: 'ユーザー発話',
      value: totals.userMessages.toLocaleString('ja-JP'),
      description: 'あなたが送信したメッセージ数'
    },
    {
      title: 'チューター発話',
      value: totals.assistantMessages.toLocaleString('ja-JP'),
      description: 'AI チューターからの回答数'
    },
    {
      title: '学習時間',
      value: `${Math.round(totals.durationSeconds / 60).toLocaleString('ja-JP')}分`,
      description: 'セッション継続時間の概算'
    }
  ];

  return (
    <section className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>学習ダッシュボード</CardTitle>
          <CardDescription>
            直近7日間の進捗を確認し、チャットでの学習状況を振り返りましょう。
            {lastUpdated ? ` 最終更新: ${lastUpdated.toLocaleDateString('ja-JP')}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => (
            <div key={card.title} className="rounded-lg border bg-card p-4 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card aria-label="教科別サマリー">
        <CardHeader>
          <CardTitle>教科別の進捗</CardTitle>
          <CardDescription>各教科で蓄積されたセッションやメッセージ数を確認できます。</CardDescription>
        </CardHeader>
        <CardContent>
          {subjectSummaries.length === 0 ? (
            <p className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
              まだ学習記録がありません。チャットを開始して記録を作りましょう。
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      教科
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold text-muted-foreground">
                      セッション
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold text-muted-foreground">
                      ユーザー発話
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold text-muted-foreground">
                      チューター発話
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold text-muted-foreground">
                      推定トークン
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold text-muted-foreground">
                      学習時間 (分)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subjectSummaries.map((summary) => (
                    <tr key={summary.subject} className="hover:bg-muted/30">
                      <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                        {summary.label}
                      </th>
                      <td className="px-4 py-3 text-right">{summary.sessions.toLocaleString('ja-JP')}</td>
                      <td className="px-4 py-3 text-right">{summary.userMessages.toLocaleString('ja-JP')}</td>
                      <td className="px-4 py-3 text-right">{summary.assistantMessages.toLocaleString('ja-JP')}</td>
                      <td className="px-4 py-3 text-right">{summary.totalTokens.toLocaleString('ja-JP')}</td>
                      <td className="px-4 py-3 text-right">{summary.totalDurationMinutes.toLocaleString('ja-JP')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card aria-label="最近の学習セッション">
        <CardHeader>
          <CardTitle>最近のセッション</CardTitle>
          <CardDescription>直近で実施したセッションの履歴です。</CardDescription>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <p className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
              まだ記録がありません。チャットを始めて最初のセッションを作成しましょう。
            </p>
          ) : (
            <ul className="space-y-3">
              {recentSessions.map((session) => (
                <li
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {SUBJECT_LABELS[session.subject as SubjectId] ?? session.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatter.format(session.startedAt)} ・ {session._count.messages} メッセージ
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
