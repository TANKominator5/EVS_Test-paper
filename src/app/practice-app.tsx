'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowRight, BarChart3, BookOpen, Check, ChevronLeft, ChevronRight,
  CircleAlert, CircleCheck, Clock3, Flag, History, LayoutGrid, Lightbulb, ListChecks, LockKeyhole,
  RotateCcw, Sprout, X,
} from 'lucide-react';
import { paperCount, papers } from '../data';
import { answer, newAttempt, options, restoreAttempts, result, summarize, topics, type Attempt, type Option, type Paper, type Question } from '../lib/practice';

const storageKey = 'evs-practice-v1';
const bn = new Intl.NumberFormat('bn-BD');
const num = (value: number) => bn.format(value);
const date = new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
type View = 'library' | 'history' | 'practice' | 'results' | 'review';

function Landscape() {
  return <svg className="landscape" viewBox="0 0 450 285" fill="none" aria-hidden="true">
    <defs><linearGradient id="hill" x1="170" y1="106" x2="255" y2="285" gradientUnits="userSpaceOnUse"><stop stopColor="#60ad82"/><stop offset="1" stopColor="#24634e"/></linearGradient></defs>
    <circle cx="278" cy="139" r="100" fill="#276752"/>
    <circle cx="278" cy="139" r="123" stroke="#83b69b" strokeOpacity=".28" strokeDasharray="3 7"/>
    <circle cx="278" cy="139" r="142" stroke="#83b69b" strokeOpacity=".15"/>
    <circle cx="323" cy="93" r="27" fill="#eac989"/>
    <path d="M46 261c46-66 88-91 142-83 34-51 79-60 113-42 47 25 80 28 149-11v160H27Z" fill="url(#hill)"/>
    <path d="M91 285c51-35 89-66 150-60 78 10 115-17 209-58v118Z" fill="#a3c6a0"/>
    <path d="M195 285c48-23 27-39 56-52 28-12 79-13 95-33-7 26-53 35-67 51-7 10 1 22 28 34Z" fill="#d7e6cd"/>
    <path d="M330 215v-78m0 53c-33 0-47-14-46-37 22 0 46 13 46 37Zm0-15c0-24 18-37 42-36 0 22-15 37-42 36Zm0-24c-17-9-21-27-11-46 17 10 20 27 11 46Z" stroke="#104b36" strokeWidth="2.4" strokeLinecap="round" fill="#70ad77"/>
    <path d="M194 213v-49m0 30c-19 0-30-10-30-25 16 0 30 9 30 25Zm0-13c1-15 13-25 28-25 0 15-10 25-28 25Z" fill="#a4c7a2" stroke="#174e3a" strokeWidth="2" strokeLinecap="round"/>
    <path d="M208 92c6-6 12-6 18 0 6-6 12-6 18 0m20-20c5-4 9-4 14 0 5-4 9-4 14 0" stroke="#c0d5ba" strokeWidth="1.7" strokeLinecap="round"/>
    <path d="M377 56v14m-7-7h14M143 124v12m-6-6h12m248-22v8m-4-4h8" stroke="#d8dfb3" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>;
}

export default function PracticeApp() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const attemptsRef = useRef<Attempt[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [view, setView] = useState<View>('library');
  const [active, setActive] = useState<string>();
  const [reviewIndex, setReviewIndex] = useState(0);
  const [filter, setFilter] = useState<'all' | 'progress' | 'complete'>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'skipped'>('all');
  const main = useRef<HTMLElement>(null);
  const questionTitle = useRef<HTMLHeadingElement>(null);
  const finishDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    try {
      const restored = restoreAttempts(localStorage.getItem(storageKey), papers);
      attemptsRef.current = restored;
      setAttempts(restored);
    } catch { setStorageError(true); }
    setReady(true);
  }, []);

  function save(next: Attempt) {
    const all = [...attemptsRef.current.filter((item) => item.id !== next.id), next];
    attemptsRef.current = all;
    setAttempts(all);
    try { localStorage.setItem(storageKey, JSON.stringify(all)); }
    catch { setStorageError(true); }
  }

  function go(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
    requestAnimationFrame(() => main.current?.focus());
  }

  const attempt = attempts.find((a) => a.id === active);
  const paper = papers.find((p) => p.id === attempt?.paperId);
  const finished = attempts.filter((a) => a.completedAt !== undefined).sort((a, b) => b.completedAt! - a.completedAt!);
  const open = attempts.filter((a) => a.completedAt === undefined);
  const completedPapers = new Set(finished.map((a) => a.paperId));
  const question = paper && attempt ? paper.questions[view === 'review' ? reviewIndex : attempt.current] : undefined;
  const score = paper && attempt ? summarize(paper, attempt) : undefined;

  function start(item: Paper) {
    if (!ready) return;
    const next = attemptsRef.current.find((a) => a.paperId === item.id && a.completedAt === undefined) ?? newAttempt(item.id);
    save(next);
    setActive(next.id);
    go('practice');
  }

  function pick(option: Option) {
    if (!attempt || !question) return;
    const latest = attemptsRef.current.find((item) => item.id === attempt.id);
    if (!latest) return;
    const next = answer(latest, question, option);
    if (next !== latest) save(next);
  }

  function move(index: number) {
    if (!paper || !attempt || index < 0 || index >= paper.questions.length) return;
    if (view === 'review') setReviewIndex(index);
    else {
      const latest = attemptsRef.current.find((item) => item.id === attempt.id);
      if (latest && latest.completedAt === undefined) save({ ...latest, current: index });
    }
    if (index !== (view === 'review' ? reviewIndex : attempt.current)) {
      requestAnimationFrame(() => questionTitle.current?.focus());
    }
  }

  function finish() {
    if (!attempt) return;
    const latest = attemptsRef.current.find((item) => item.id === attempt.id);
    if (!latest || latest.completedAt !== undefined) return;
    finishDialog.current?.close();
    save({ ...latest, completedAt: Date.now() });
    go('results');
  }

  function showResults(item: Attempt) {
    setActive(item.id);
    setReviewFilter('all');
    go('results');
  }

  function showReview(index: number) {
    setReviewIndex(index);
    go('review');
  }

  return <>
    <a href="#main" className="skip-link">মূল অংশে যান</a>
    <header className="site-header">
      <div className="shell header-inner">
        <button className="brand" type="button" onClick={() => go('library')}>
          <span className="brand-icon"><Sprout size={24} strokeWidth={2} /></span>
          <span><strong>পরিবেশ পাঠ</strong><small lang="en">EVS PRACTICE</small></span>
        </button>
        <nav aria-label="প্রধান নেভিগেশন" className="primary-nav">
          <button aria-current={view === 'library' ? 'page' : undefined} onClick={() => go('library')}><LayoutGrid size={16}/> <span>প্র্যাকটিস সেট</span></button>
          <button aria-current={view === 'history' ? 'page' : undefined} onClick={() => go('history')}><History size={17}/> <span>আমার ফলাফল</span></button>
        </nav>
      </div>
    </header>
    <main id="main" className="shell main" ref={main} tabIndex={-1}>
      {storageError && <p className="warning" role="status"><CircleAlert size={18}/> এই ব্রাউজারে অগ্রগতি সংরক্ষণ করা যাচ্ছে না। পেজ বন্ধ করলে এই সেশনের উত্তর হারাতে পারে।</p>}
      {view === 'library' && <>
        <section className="hero" aria-labelledby="hero-heading">
          <Landscape />
          <div className="hero-copy">
            <span className="hero-badge"><span/> প্রাথমিক টেট প্রস্তুতি</span>
            <h1 id="hero-heading">পরিবেশ বিদ্যা<br/><em>অনুশীলন করুন</em></h1>
            <p>প্রশ্ন বাছুন, সঙ্গে সঙ্গে উত্তর ও বাংলা ব্যাখ্যা দেখুন, আর ফলাফল থেকে বুঝে নিন কোন বিষয় আরও পড়তে হবে।</p>
            <a href="#sets" className="hero-button">প্র্যাকটিস সেট দেখুন <ArrowDown size={17}/></a>
          </div>
        </section>
        <div className="overview" aria-label="অনুশীলনের সারাংশ">
          <div><span className="stat-icon mint"><BookOpen size={21}/></span><div><strong>{num(papers.length)} / {num(paperCount)}</strong><small>প্রস্তুত প্র্যাকটিস সেট</small></div></div>
          <div><span className="stat-icon amber"><Clock3 size={21}/></span><div><strong>{num(open.length)}</strong><small>চলমান সেট</small></div></div>
          <div><span className="stat-icon mint"><CircleCheck size={21}/></span><div><strong>{num(completedPapers.size)}</strong><small>সম্পন্ন সেট</small></div></div>
        </div>
        <section className="sets" id="sets" aria-labelledby="sets-heading">
          <div className="section-heading">
            <div><span className="eyebrow"><LayoutGrid size={14}/> সেট লাইব্রেরি</span><h2 id="sets-heading">প্র্যাকটিস সেট বেছে নিন</h2><p>প্রতিটি সেটে ৩০টি বহুনির্বাচনী প্রশ্ন। কোনো সময়সীমা নেই।</p></div>
            <div className="filters" role="group" aria-label="সেটের অবস্থা">
              <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>সব সেট</button>
              <button aria-pressed={filter === 'progress'} onClick={() => setFilter('progress')}>চলমান</button>
              <button aria-pressed={filter === 'complete'} onClick={() => setFilter('complete')}>সম্পন্ন</button>
            </div>
          </div>
          {(() => {
            const ids = Array.from({ length: paperCount }, (_, i) => i + 1).filter((id) => filter === 'all' || (filter === 'progress' ? open.some((a) => a.paperId === id) : completedPapers.has(id)));
            return ids.length ? <div className="paper-grid">{ids.map((id) => {
              const item = papers.find((p) => p.id === id);
              const draft = open.find((a) => a.paperId === id);
              const latest = finished.find((a) => a.paperId === id);
              const total = item?.questions.length ?? 30;
              const done = Object.keys(draft?.answers ?? {}).length;
              return <article className="paper-card" key={id}>
                <div className="card-top"><span className="paper-index">{num(id).padStart(2, '০')}</span><span className={`status-pill ${!item ? 'neutral' : draft ? 'pending' : ''}`}>{!item ? 'প্রস্তুত নয়' : draft ? 'চলমান' : latest ? 'সম্পন্ন' : 'অনুশীলনের জন্য প্রস্তুত'}</span></div>
                <h3>প্র্যাকটিস সেট {num(id)}</h3>
                <p><ListChecks size={15}/> {num(total)}টি প্রশ্ন {draft && <span className="dim">· {num(done)}টির উত্তর দেওয়া হয়েছে</span>}</p>
                {draft && <progress className="progress" value={done} max={total} aria-label="উত্তর দেওয়া প্রশ্ন"/>}
                <div className="card-actions">
                  <button className="paper-action" disabled={!item || !ready} onClick={() => item && start(item)}>{!item ? 'এখনও উপলব্ধ নয়' : draft ? 'অনুশীলন চালিয়ে যান' : latest ? 'আবার অনুশীলন করুন' : 'অনুশীলন শুরু করুন'}{item ? <ArrowRight size={17}/> : <LockKeyhole size={15}/>}</button>
                  {latest && <button className="icon-button" aria-label={`সেট ${num(id)}-এর ফলাফল`} onClick={() => showResults(latest)}><BarChart3 size={19}/></button>}
                </div>
              </article>;
            })}</div> : <div className="empty"><History size={24}/><p>{filter === 'progress' ? 'এখন কোনো সেট চলমান নেই।' : 'এখনও কোনো সেট সম্পন্ন হয়নি।'}</p></div>;
          })()}
        </section>
      </>}

      {view === 'history' && <section aria-labelledby="history-title">
        <button className="back" onClick={() => go('library')}><ArrowLeft size={17}/> সব প্র্যাকটিস সেট</button>
        <div className="page-heading"><span className="eyebrow"><History size={15}/> অনুশীলনের ইতিহাস</span><h1 id="history-title">আমার ফলাফল</h1><p>এই ব্রাউজারে সংরক্ষিত সম্পন্ন অনুশীলনগুলো।</p></div>
        {finished.length ? <div className="history-list">{finished.map((item) => {
          const source = papers.find((p) => p.id === item.paperId)!;
          const summary = summarize(source, item);
          return <button className="history-row" key={item.id} onClick={() => showResults(item)}><span className="stat-icon mint"><BarChart3 size={20}/></span><span><strong>প্র্যাকটিস সেট {num(item.paperId)}</strong><small>{date.format(item.completedAt!)}</small></span><strong className="history-score">{num(summary.correct)} / {num(summary.total)}</strong><ChevronRight size={19}/></button>;
        })}</div> : <div className="empty"><BarChart3 size={27}/><h2>এখনও কোনো ফলাফল নেই</h2><p>একটি সেট শেষ করলে তার ফলাফল এখানে দেখা যাবে।</p><button className="primary" onClick={() => go('library')}>সেট বেছে নিন <ArrowRight size={17}/></button></div>}
      </section>}

      {(view === 'practice' || view === 'review') && attempt && paper && score && question && (() => {
        const review = view === 'review';
        const index = review ? reviewIndex : attempt.current;
        const picked = attempt.answers[question.id];
        const feedback = review || picked !== undefined;
        const outcome = result(question, attempt);
        const order = options.indexOf(question.key);
        return <>
          <button className="back" onClick={() => go(review ? 'results' : 'library')}><ArrowLeft size={17}/> {review ? 'ফলাফলে ফিরুন' : 'সব প্র্যাকটিস সেট'}</button>
          <div className="page-heading"><span className="eyebrow"><BookOpen size={15}/> {review ? 'উত্তর পর্যালোচনা' : 'পরিবেশ বিদ্যা'}</span><h1>প্র্যাকটিস সেট {num(paper.id)}</h1><p>{review ? 'সম্পন্ন অনুশীলনের উত্তর ও ব্যাখ্যা' : `মোট ${num(score.total)}টি প্রশ্ন · প্রথম উত্তরটিই গণনা হবে`}</p></div>
          <div className="practice-layout">
            <div className="question-column">
              <section className="panel question" aria-labelledby="question-title">
                <div className="question-meta"><span className="question-count">প্রশ্ন {num(index + 1)} / {num(score.total)}</span><span className="topic-chip">{topics[question.topic]}</span></div>
                <h2 id="question-title" ref={questionTitle} tabIndex={-1}>{question.text}</h2>
                <div className="choices" role="group" aria-label="উত্তরের বিকল্প">
                  {options.map((letter, i) => {
                    const correct = feedback && letter === question.key;
                    const wrong = feedback && letter === picked && !correct;
                    const label = question.labels?.[i] ?? letter;
                    return <button key={letter} type="button" className={`choice ${correct ? 'choice-right' : wrong ? 'choice-wrong' : ''}`} aria-disabled={feedback} aria-label={`${label}: ${question.choices[i]}${correct ? ' (উত্তরসূচির উত্তর)' : wrong ? ' (আপনার ভুল উত্তর)' : ''}`} onClick={() => !feedback && pick(letter)}>
                      <span className="choice-letter" lang="en">{label}</span><span className="choice-text">{question.choices[i]}</span>{correct && <Check size={20}/>} {wrong && <X size={20}/>}
                    </button>;
                  })}
                </div>
                <div aria-live="polite" aria-atomic="true" className="sr-only">{feedback ? outcome === 'correct' ? 'আপনার উত্তর সঠিক।' : `মুদ্রিত উত্তর ${question.key}। ${outcome === 'wrong' ? 'আপনার উত্তর ভুল।' : 'আপনি উত্তর দেননি।'}` : ''}</div>
                {feedback && <section className={`feedback ${outcome}`} aria-labelledby="feedback-title">
                  <div className="feedback-title">{outcome === 'correct' ? <CircleCheck size={22}/> : outcome === 'wrong' ? <CircleAlert size={22}/> : <CircleAlert size={22}/>}<div><h3 id="feedback-title">{outcome === 'correct' ? 'সঠিক উত্তর!' : outcome === 'wrong' ? 'উত্তরটি মেলেনি' : 'উত্তর দেওয়া হয়নি'}</h3><p>মুদ্রিত উত্তর: <strong>{question.key} · {question.choices[order]}</strong></p></div></div>
                  {question.anomaly && <div className="warning"><Flag size={17}/><div><strong>উত্তরসূচিতে অসঙ্গতি (Anomaly)</strong><p>{question.anomaly} স্কোর মুদ্রিত উত্তরসূচি অনুযায়ী।</p></div></div>}
                  <h4>বিকল্পগুলোর ব্যাখ্যা (Explanation)</h4>
                  <ul className="reasons">{options.map((letter, i) => <li key={letter}><span className={letter === question.key ? 'reason-key' : ''}>{question.labels?.[i] ?? letter}</span><p>{question.reasons[i]}</p></li>)}</ul>
                  <div className="study-note"><Lightbulb size={20}/><div><strong>মনে রাখুন (Study Note)</strong><p>{question.note}</p></div></div>
                </section>}
                <div className="question-controls"><button className="secondary" disabled={index === 0} onClick={() => move(index - 1)}><ChevronLeft size={18}/> আগের প্রশ্ন</button><button className="primary" disabled={index >= score.total - 1} onClick={() => move(index + 1)}>পরের প্রশ্ন <ChevronRight size={18}/></button></div>
              </section>
            </div>
            <aside className="panel navigator" aria-labelledby="navigator-title">
              <h2 id="navigator-title"><LayoutGrid size={17}/> প্রশ্ন তালিকা</h2>
              <p>{num(score.correct + score.wrong)} / {num(score.total)}টির উত্তর দেওয়া হয়েছে</p>
              <progress className="progress" value={score.correct + score.wrong} max={score.total} aria-label="উত্তর দেওয়া প্রশ্ন"/>
              <div className="question-grid">
                {paper.questions.map((q, i) => <button key={q.id} aria-current={i === index ? 'step' : undefined} className={review ? result(q, attempt) : attempt.answers[q.id] ? 'answered' : ''} onClick={() => move(i)} aria-label={`প্রশ্ন ${num(q.id)}, ${attempt.answers[q.id] ? review ? result(q, attempt) === 'correct' ? 'সঠিক' : 'ভুল' : 'উত্তর দেওয়া হয়েছে' : 'উত্তর দেওয়া হয়নি'}`}>{num(q.id)}</button>)}
              </div>
              <div className="legend"><span><i className="legend-answered"/>{review ? 'সঠিক' : 'উত্তর দেওয়া'}</span>{review && <span><i className="legend-wrong"/>ভুল</span>}<span><i/>উত্তর দেওয়া হয়নি</span></div>
              {!review && <button className="primary finish" onClick={() => score.skipped ? finishDialog.current?.showModal() : finish()}><Flag size={17}/> সেট শেষ করুন</button>}
            </aside>
          </div>
          <dialog ref={finishDialog} className="finish-dialog" aria-labelledby="finish-title">
            <span className="stat-icon amber"><Flag size={22}/></span><h2 id="finish-title">অনুশীলন শেষ করবেন?</h2><p>{num(score.skipped)}টি প্রশ্নের উত্তর দেননি। এখন শেষ করলে সেগুলো ফলাফলে অনুত্তরিত দেখাবে।</p>
            <div><button className="secondary" autoFocus onClick={() => finishDialog.current?.close()}>অনুশীলনে ফিরুন</button><button className="primary" onClick={finish}>শেষ করুন</button></div>
          </dialog>
        </>;
      })()}

      {view === 'results' && paper && attempt && score && <>
        <button className="back" onClick={() => go('library')}><ArrowLeft size={17}/> সব প্র্যাকটিস সেট</button>
        <div className="page-heading"><span className="eyebrow"><BarChart3 size={16}/> অনুশীলনের ফলাফল</span><h1>প্র্যাকটিস সেট {num(paper.id)} · ফলাফল</h1><p>{date.format(attempt.completedAt!)} · মুদ্রিত উত্তরসূচি অনুযায়ী নম্বর</p></div>
        <div className="result-summary">
          <div className="score-card"><span>মোট স্কোর</span><strong>{num(score.correct)} <small>/ {num(score.total)}</small></strong><span>{num(Math.round(score.correct / score.total * 100))}% সঠিক</span></div>
          <div className="result-stat"><span className="stat-icon mint"><Check size={20}/></span><strong>{num(score.correct)}</strong><small>সঠিক</small></div>
          <div className="result-stat"><span className="stat-icon rose"><X size={20}/></span><strong>{num(score.wrong)}</strong><small>ভুল</small></div>
          <div className="result-stat"><span className="stat-icon amber"><CircleAlert size={20}/></span><strong>{num(score.skipped)}</strong><small>অনুত্তরিত</small></div>
        </div>
        <div className="results-layout">
          <section className="panel results-panel"><h2>বিষয়ভিত্তিক বিশ্লেষণ</h2><p>কম সঠিক হয়েছে এমন বিষয় আগে দেখানো হয়েছে।</p>
            <div className="topic-breakdown">{score.byTopic.map((row) => <div key={row.topic}>
              <div className="topic-row"><strong>{topics[row.topic]}</strong><span>{num(row.correct)} / {num(row.total)} সঠিক</span></div>
              <div className="topic-bar" role="img" aria-label={`${num(row.correct)} সঠিক, ${num(row.wrong)} ভুল, ${num(row.skipped)} অনুত্তরিত`}>
                <i style={{ flex: row.correct }} /><i style={{ flex: row.wrong }} /><i style={{ flex: row.skipped }} />
              </div>
            </div>)}</div>
          </section>
          <section className="panel results-panel"><h2>প্রশ্ন পর্যালোচনা</h2><p>উত্তর ও ব্যাখ্যা দেখতে প্রশ্নের নম্বর বেছে নিন।</p>
            <div className="filters review-filters" role="group" aria-label="উত্তরের অবস্থা">
              <button aria-pressed={reviewFilter === 'all'} onClick={() => setReviewFilter('all')}>সব</button><button aria-pressed={reviewFilter === 'wrong'} onClick={() => setReviewFilter('wrong')}>ভুল</button><button aria-pressed={reviewFilter === 'skipped'} onClick={() => setReviewFilter('skipped')}>অনুত্তরিত</button>
            </div>
            <div className="question-grid review-grid">{paper.questions.map((q, i) => {
              const state = result(q, attempt);
              return (reviewFilter === 'all' || reviewFilter === state) && <button key={q.id} className={state} onClick={() => showReview(i)} aria-label={`প্রশ্ন ${num(q.id)}, ${state === 'correct' ? 'সঠিক' : state === 'wrong' ? 'ভুল' : 'অনুত্তরিত'}`}>{num(q.id)}</button>;
            })}</div>
            {reviewFilter !== 'all' && score[reviewFilter] === 0 && <p>এই বিভাগে কোনো প্রশ্ন নেই।</p>}
            <button className="primary retry" onClick={() => start(paper)}><RotateCcw size={17}/> {open.some((a) => a.paperId === paper.id) ? 'চলমান অনুশীলনে ফিরুন' : 'আবার অনুশীলন করুন'}</button>
          </section>
        </div>
      </>}
    </main>
    <footer className="footer"><div className="shell"><span><Sprout size={16}/> পরিবেশ পাঠ <small>· EVS Practice</small></span><span><LockKeyhole size={14}/> অগ্রগতি এই ব্রাউজারেই থাকে</span></div></footer>
  </>;
}
