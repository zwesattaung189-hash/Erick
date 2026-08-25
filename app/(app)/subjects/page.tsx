'use client';

import { useEffect, useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSubjects } from '@/lib/context/SubjectsContext';
import { SUBJECT_COLORS, type Topic } from '@/lib/types';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Plus, PlusCircle, Trash2 } from 'lucide-react';

export default function SubjectsPage() {
  const supabase = createClient();
  const { subjects, refreshSubjects } = useSubjects();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('topics')
      .select('*')
      .then(({ data }) => setTopics((data as Topic[]) ?? []));
  }, [subjects, supabase]);

  function progressFor(subjectId: string) {
    const t = topics.filter((x) => x.subject_id === subjectId);
    if (!t.length) return 0;
    return Math.round((t.filter((x) => x.completed).length / t.length) * 100);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('subjects').insert({ user_id: user.id, name: name.trim(), color });
    setName('');
    setColor(SUBJECT_COLORS[0]);
    setModalOpen(false);
    refreshSubjects();
  }

  async function handleDelete(id: string) {
    await supabase.from('subjects').delete().eq('id', id);
    refreshSubjects();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--ink)]">Subjects</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">Everything you&apos;re studying, organized in one place.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="hidden md:flex items-center gap-2 bg-accent text-white text-sm font-semibold rounded-lg px-4 py-2.5 hover:bg-accent/90"
        >
          <Plus className="w-4 h-4" /> New subject
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((s) => {
          const p = progressFor(s.id);
          const topicCount = topics.filter((t) => t.subject_id === s.id).length;
          const c = 2 * Math.PI * 20;
          const offset = c - (p / 100) * c;
          return (
            <div
              key={s.id}
              className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-5 shadow-sm flex flex-col gap-3 border-t-4 hover:-translate-y-0.5 hover:shadow-md transition"
              style={{ borderTopColor: s.color }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display font-bold text-base text-[var(--ink)]">{s.name}</h3>
                  <span className="text-xs text-[var(--ink-soft)]">
                    {topicCount} topic{topicCount === 1 ? '' : 's'}
                  </span>
                </div>
                <svg viewBox="0 0 50 50" className="w-[46px] h-[46px] flex-shrink-0">
                  <circle cx="25" cy="25" r="20" fill="none" stroke="var(--bg-sunken)" strokeWidth="5" />
                  <circle
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke={s.color}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    transform="rotate(-90 25 25)"
                  />
                </svg>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className="font-mono font-semibold text-sm" style={{ color: s.color }}>
                  {p}% complete
                </span>
                <button
                  onClick={() => setConfirmId(s.id)}
                  className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--ink-soft)] hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => setModalOpen(true)}
          className="border-[1.5px] border-dashed border-[var(--border)] rounded-xl min-h-[160px] flex flex-col items-center justify-center gap-2 text-[var(--ink-faint)] font-semibold text-sm hover:border-accent hover:text-accent hover:bg-accent-soft dark:hover:bg-accent/10 transition"
        >
          <PlusCircle className="w-6 h-6" />
          Add subject
        </button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New subject">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink-soft)]">
            Subject name
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Machine Learning"
              className="border border-[var(--border)] rounded-lg px-3 py-2.5 bg-[var(--bg-sunken)] text-[var(--ink)] text-sm font-normal outline-none focus:border-accent"
            />
          </label>
          <div className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink-soft)]">
            Color
            <div className="flex gap-2 flex-wrap">
              {SUBJECT_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ background: c }}
                  className={`w-7 h-7 rounded-full border-2 ${
                    color === c ? 'border-[var(--ink)] ring-2 ring-[var(--bg-elevated)]' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--ink-soft)] border border-[var(--border)] hover:bg-[var(--bg-sunken)]"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-accent hover:bg-accent/90">
              Add subject
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && handleDelete(confirmId)}
        text="Delete this subject? Its notes, resources, and schedule sessions will stay but lose their subject label. Its topics will be deleted."
      />
    </div>
  );
}
