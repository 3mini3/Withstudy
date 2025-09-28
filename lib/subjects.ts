import type { SubjectId } from './studentContext';

export interface SubjectConfig {
  id: SubjectId;
  label: string;
  description: string;
  context: string;
}

export const SUBJECT_CONFIGS: SubjectConfig[] = [
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

export const SUBJECT_CONFIG_BY_ID: Record<SubjectId, SubjectConfig> = SUBJECT_CONFIGS.reduce(
  (acc, subject) => {
    acc[subject.id] = subject;
    return acc;
  },
  {} as Record<SubjectId, SubjectConfig>
);

export const SUBJECT_IDS = SUBJECT_CONFIGS.map((subject) => subject.id);

export function getSubjectConfig(subjectId: SubjectId): SubjectConfig {
  return SUBJECT_CONFIG_BY_ID[subjectId];
}
