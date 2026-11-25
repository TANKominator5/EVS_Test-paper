export const options = ['A', 'B', 'C', 'D'] as const;
export type Option = typeof options[number];
export type Topic = keyof typeof topics;
export const topics = {
  H: 'মানবদেহ ও স্বাস্থ্য', E: 'বাস্তুতন্ত্র ও সংরক্ষণ', P: 'উদ্ভিদ ও প্রাণী',
  F: 'খাদ্য ও পুষ্টি', S: 'পদার্থ ও রসায়ন', W: 'জল, বায়ু ও শক্তি',
  T: 'পরিবেশ শিক্ষা ও শিক্ষণ', G: 'সমাজ, ভূগোল ও সংস্কৃতি',
};

export type Question = {
  id: number;
  text: string;
  choices: [string, string, string, string];
  key: Option;
  topic: Topic;
  reasons: [string, string, string, string];
  labels?: readonly [string, string, string, string];
  note: string;
  anomaly?: string;
};
export type Paper = { id: number; questions: Question[] };
export type Attempt = {
  id: string;
  paperId: number;
  startedAt: number;
  completedAt?: number;
  current: number;
  answers: Partial<Record<number, Option>>;
};

export function parsePaper(id: number, key: string, source: string, printedLabels: Partial<Record<number, Question['labels']>> = {}): Paper {
  const rows = source.trim().split('\n').filter((line) => line.trim());
  if (rows.length !== 30 || !/^[ABCD]{30}$/.test(key)) throw new Error(`Set ${id}: expected 30 rows and 30 keys`);
  return { id, questions: rows.map((row, i) => {
    const fields = row.split('|').map((part) => part.trim().replaceAll('\\n', '\n'));
    const [topic, text, a, b, c, d, ra, rb, rc, rd, note, anomaly] = fields;
    if ((fields.length !== 11 && fields.length !== 12) || !Object.hasOwn(topics, topic) || fields.some((value) => !value)) {
      throw new Error(`Set ${id}, question ${i + 1}: invalid record`);
    }
    return { id: i + 1, topic: topic as Topic, text, choices: [a, b, c, d], key: key[i] as Option, reasons: [ra, rb, rc, rd], note, anomaly, labels: printedLabels[i + 1] };
  }) };
}

export function newAttempt(paperId: number): Attempt {
  return { id: crypto.randomUUID(), paperId, startedAt: Date.now(), current: 0, answers: {} };
}

export function answer(attempt: Attempt, question: Question, option: Option): Attempt {
  if (attempt.completedAt !== undefined || attempt.answers[question.id] !== undefined) return attempt;
  return { ...attempt, answers: { ...attempt.answers, [question.id]: option } };
}

export function result(question: Question, attempt: Attempt) {
  const picked = attempt.answers[question.id];
  return picked === undefined ? 'skipped' : question.key === picked ? 'correct' : 'wrong';
}

export function summarize(paper: Paper, attempt: Attempt) {
  const scores = { correct: 0, wrong: 0, skipped: 0 };
  const byTopic = new Map<Topic, typeof scores & { topic: Topic; total: number }>();
  for (const q of paper.questions) {
    const row = byTopic.get(q.topic) ?? { topic: q.topic, total: 0, correct: 0, wrong: 0, skipped: 0 };
    const outcome = result(q, attempt);
    scores[outcome]++;
    row[outcome]++;
    row.total++;
    byTopic.set(q.topic, row);
  }
  return { ...scores, total: paper.questions.length, byTopic: [...byTopic.values()].sort((a, b) => a.correct / a.total - b.correct / b.total) };
}

export function restoreAttempts(raw: string | null, papers: readonly Paper[]): Attempt[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const ids = new Set<string>();
    return data.flatMap((entry): Attempt[] => {
      if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string' || ids.has(entry.id) || !Number.isFinite(entry.startedAt)) return [];
      const paper = papers.find((item) => item.id === entry.paperId);
      if (!paper) return [];
      ids.add(entry.id);
      const answers: Attempt['answers'] = {};
      for (const q of paper.questions) {
        const saved = entry.answers?.[q.id];
        if (options.includes(saved)) answers[q.id] = saved;
      }
      const current = Number.isInteger(entry.current) && entry.current >= 0 && entry.current < paper.questions.length ? entry.current : 0;
      return [{ id: entry.id, paperId: paper.id, startedAt: entry.startedAt, completedAt: Number.isFinite(entry.completedAt) ? entry.completedAt : undefined, current, answers }];
    });
  } catch { return []; }
}
