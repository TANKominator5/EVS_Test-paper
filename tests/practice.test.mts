import assert from 'node:assert/strict';
import { test } from 'node:test';
import { answer, newAttempt, options, parsePaper, restoreAttempts, result, summarize } from '../src/lib/practice.ts';
import { set01 } from '../src/data/set-01.ts';
import { papers } from '../src/data/index.ts';

test('published sets have full transcripts and match their printed keys', () => {
  const keys: Record<number, string> = {
    1: 'BAADACDCBABBBADCCDABBADCAADDBD',
    2: 'CBAADDCBDADCACCABADDAABBDDAABD',
    3: 'DAAADDABAAAACBBBCACCBDDBBBADDB',
    4: 'CCACDBAAADDABDAADAAACBBABCBDDB',
    5: 'DBCADACABAABADAACCAACDACBBAADC',
    6: 'DCBDDBAABDABACCDACBBACBBDBAABC',
    7: 'BDDAAABACCCACABACAACCCCADBBACC',
    8: 'CADBABCADDCAACCDADACBDCBBABCCA',
    9: 'ABCDADCDBCCCDACBBCBBBCBCADACBA',
    10: 'DBCBCCCBDCCBBBCBAAADCBCCCADDAA',
  };
  assert.equal(new Set(papers.map((paper) => paper.id)).size, papers.length);
  for (const paper of papers) {
    assert.equal(paper.questions.length, 30);
    assert.equal(paper.questions.map((q) => q.key).join(''), keys[paper.id]);
    paper.questions.forEach((q, i) => {
      assert.equal(q.id, i + 1);
      assert.equal(q.choices.length, 4);
      assert.equal(q.reasons.length, 4);
      assert.ok(q.note);
    });
  }
  assert.throws(() => parsePaper(1, 'A', 'missing-data'));
});

test('first pick is immutable and review cannot write answers', () => {
  const [q1, q2] = set01.questions;
  const start = newAttempt(1);
  const picked = answer(start, q1, 'A');
  assert.equal(result(q1, picked), 'wrong');
  assert.equal(answer(picked, q1, 'B'), picked);
  assert.equal(result(q1, start), 'skipped');
  const done = { ...picked, completedAt: Date.now() };
  assert.equal(answer(done, q2, options[0]), done);
});

test('score counts skips and grades a flagged anomaly against the key', () => {
  const q29 = set01.questions[28];
  assert.ok(q29.anomaly);
  const attempt = { ...newAttempt(1), answers: { 1: 'A', 29: q29.key } as const };
  const summary = summarize(set01, attempt);
  assert.deepEqual([summary.correct, summary.wrong, summary.skipped, summary.total], [1, 1, 28, 30]);
  assert.equal(summary.byTopic.reduce((sum, item) => sum + item.total, 0), 30);
});

test('local data round-trips attempts and sanitizes malformed entries', () => {
  const start = newAttempt(1);
  const working = { ...start, current: 7, answers: { 1: 'B' } as const };
  const done = { ...working, completedAt: Date.now() };
  const retry = newAttempt(1);
  assert.notEqual(done.id, retry.id);
  assert.deepEqual(restoreAttempts(JSON.stringify([done, retry]), [set01]), [done, { ...retry, completedAt: undefined }]);
  assert.deepEqual(restoreAttempts('not-json', [set01]), []);
  const [restored] = restoreAttempts(JSON.stringify([{ ...start, current: 100, answers: { 1: 'Z', 2: 'D', 31: 'A' } }]), [set01]);
  assert.equal(restored.current, 0);
  assert.deepEqual(restored.answers, { 2: 'D' });
});
