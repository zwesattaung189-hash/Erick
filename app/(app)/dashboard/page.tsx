'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSubjects } from '@/lib/context/SubjectsContext';
import type { Topic, ScheduleSession } from '@/lib/types';
import { Layers, NotebookPen, CheckCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const TODAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
  new Date().getDay()
];

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function DashboardPage() {
  const supabase = createClient();
  const { subjects } = useSubjects();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [noteCount, setNoteCount] = useState(0);
  const [todaySessions, setTodaySessions] = useState<ScheduleSession[]>([]);
  const [greeting, setGreeting] = useState('Welcome back');

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
  }, []);

  useEffect(() => {
    (async () => {
      const [{ data: topicsData }, { count }, { data: sessionsData }] = await Promise.all([
        supabase.from('topics').select('*'),
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase
          .from('schedule_sessions')
          .select('*')
          .eq('day_of_week', TODAY)
          .order('start_time', { ascending: true }),
      ]);
      setTopics((topicsData as Topic[]) ?? []);
      setNoteCount(count ?? 0);
      setTodaySessions((sessionsData as ScheduleSession[]) ?? []);
    })();
  }, [supabase]);

  const total = topics.length;
  const done = topics.filter((t) => t.completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (pct / 100) * circumference;

  const subjectName = (id: string | null) => subjects.find((s) => s.id === id)?.name ?? 'Unassigned';
  const subjectColor = (id: string | null) => subjects.find((s) => s.id === id)?.color ?? '#2F5FD1';

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-[var(--ink)]">Home</h1>
      <p className="text-sm text-[var(--ink-soft)] mt-1 mb-6">Your study session at a glance.</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Ring panel */}
        <div className="md:col-span-2 md:row-span-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-center shadow-sm">
          <div className="relative w-[140px] h-[140px]">
            <svg viewBox="0 0 140 140" className="w-[140px] h-[140px] -rotate-90">
              <circle cx="70" cy="70" r="60" fill="none" stroke="var(--bg-sunken)" strokeWidth="10" />
              <circle
                cx="70"
                cy="70"
                r="60"
                fill="none"
                stroke="#2F5FD1"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-2xl font-semibold text-[var(--ink)]">{pct}%</span>
              <span className="text-[0.7rem] uppercase tracking-wide text-[var(--ink-faint)]">overall</span>
            </div>
          </div>
          <div>
            <p className="font-display font-semibold text-lg text-[var(--ink)]">{greeting}. Ready to study?</p>
            <p className="text-sm text-[var(--ink-soft)] mt-1 max-w-[220px]">
              Keep the streak going — small sessions add up.
            </p>
          </div>
        </div>

        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <Layers className="w-[26px] h-[26px] text-accent bg-accent-soft dark:bg-accent/20 rounded-lg p-2 box-content" />
          <div>
            <span className="block font-mono text-xl font-semibold text-[var(--ink)]">{subjects.length}</span>
            <span className="text-xs text-[var(--ink-soft)]">subjects</span>
          </div>
        </div>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <NotebookPen className="w-[26px] h-[26px] text-accent bg-accent-soft dark:bg-accent/20 rounded-lg p-2 box-content" />
          <div>
            <span className="block font-mono text-xl font-semibold text-[var(--ink)]">{noteCount}</span>
            <span className="text-xs text-[var(--ink-soft)]">notes saved</span>
          </div>
        </div>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-3 shadow-sm md:col-span-2">
          <CheckCheck className="w-[26px] h-[26px] text-accent bg-accent-soft dark:bg-accent/20 rounded-lg p-2 box-content" />
          <div>
            <span className="block font-mono text-xl font-semibold text-[var(--ink)]">
              {done}/{total}
            </span>
            <span className="text-xs text-[var(--ink-soft)]">topics done</span>
          </div>
        </div>

        {/* Today's schedule */}
        <div className="md:col-span-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-sm text-[var(--ink)]">Today&apos;s schedule</h2>
            <Link href="/schedule" className="text-xs font-semibold text-[var(--ink-soft)] flex items-center gap-1 hover:text-accent">
              Open planner <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {todaySessions.length ? (
              todaySessions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--bg-sunken)] border-l-[3px]"
                  style={{ borderColor: subjectColor(s.subject_id) }}
                >
                  <time className="font-mono text-xs text-[var(--ink-soft)] whitespace-nowrap">{formatTime(s.start_time)}</time>
                  <div>
                    <strong className="text-sm text-[var(--ink)] block">{s.topic}</strong>
                    <span className="text-xs text-[var(--ink-soft)]">{subjectName(s.subject_id)}</span>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-sm text-[var(--ink-soft)] px-1 py-2">Nothing scheduled for today.</li>
            )}
          </ul>
        </div>

        {/* Subject progress bars */}
        <div className="md:col-span-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-sm text-[var(--ink)]">Subject progress</h2>
            <Link href="/subjects" className="text-xs font-semibold text-[var(--ink-soft)] flex items-center gap-1 hover:text-accent">
              All subjects <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {subjects.length ? (
              subjects.map((s) => {
                const subTopics = topics.filter((t) => t.subject_id === s.id);
                const p = subTopics.length ? Math.round((subTopics.filter((t) => t.completed).length / subTopics.length) * 100) : 0;
                return (
                  <div key={s.id} className="flex items-center gap-3 text-sm">
                    <span className="w-[130px] flex-shrink-0 font-medium text-[var(--ink)] truncate">{s.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-[var(--bg-sunken)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${p}%`, background: s.color, transition: 'width .6s ease' }}
                      />
                    </div>
                    <span className="font-mono text-xs text-[var(--ink-soft)] w-9 text-right">{p}%</span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-[var(--ink-soft)]">Add a subject to see progress here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
