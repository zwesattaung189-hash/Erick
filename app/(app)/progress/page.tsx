'use client';

import { useEffect, useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSubjects } from '@/lib/context/SubjectsContext';
import type { Topic } from '@/lib/types';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Plus, X } from 'lucide-react';

export default function ProgressPage() {
  const supabase = createClient();
  const { subjects } = useSubjects();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [addModalSubject, setAddModalSubject] = useState<string | null>(null);
  const [topicName, setTopicName] = useState('');
  const [confirmTopic, setConfirmTopic] = useState<Topic | null>(null);

  async function loadTopics() {
    const { data } = await supabase.from('topics').select('*').order('created_at', { ascending: true });
    setTopics((data as Topic[]) ?? []);
  }

  useEffect(() => {
    loadTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = topics.length;
  const done = topics.filter((t) => t.completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const masteredSubjects = subjects.filter((s) => {
    const t = topics.filter((x) => x.subject_id === s.id);
    return t.length > 0 && t.every((x) => x.completed);
  }).length;

  async function toggleTopic(t: Topic) {
    setTopics((prev) => prev.map((x) => (x.id === t.id ? { ...x, completed: !x.completed } : x)));
    await supabase.from('topics').update({ completed: !t.completed }).eq('id', t.id);
  }

  async function handleAddTopic(e: FormEvent) {
    e.preventDefault();
    if (!topicName.trim() || !addModalSubject) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('topics').insert({ user_id: user.id, subject_id: addModalSubject, name: topicName.trim() });
    setTopicName('');
    setAddModalSubject(null);
    loadTopics();
  }

  async function handleDeleteTopic(id: string) {
    await supabase.from('topics').delete().eq('id', id);
    loadTopics();
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-[var(--ink)]">Progress</h1>
      <p className="text-sm text-[var(--ink-soft)] mt-1 mb-6">Track completion across every subject.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-4 text-center">
          <div className="font-mono text-2xl font-bold text-accent">{pct}%</div>
          <div className="text-xs text-[var(--ink-soft)] mt-1">Overall progress</div>
        </div>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-4 text-center">
          <div className="font-mono text-2xl font-bold text-accent">
            {done}/{total}
          </div>
          <div className="text-xs text-[var(--ink-soft)] mt-1">Topics completed</div>
        </div>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-4 text-center">
          <div className="font-mono text-2xl font-bold text-accent">{subjects.length}</div>
          <div className="text-xs text-[var(--ink-soft)] mt-1">Active subjects</div>
        </div>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-4 text-center">
          <div className="font-mono text-2xl font-bold text-accent">{masteredSubjects}</div>
          <div className="text-xs text-[var(--ink-soft)] mt-1">Subjects mastered</div>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        {subjects.length === 0 && (
          <p className="text-sm text-[var(--ink-soft)] text-center py-10">Add a subject first to start tracking topics.</p>
        )}
        {subjects.map((s) => {
          const subTopics = topics.filter((t) => t.subject_id === s.id);
          const sPct = subTopics.length ? Math.round((subTopics.filter((t) => t.completed).length / subTopics.length) * 100) : 0;
          return (
            <div key={s.id} className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-5 border-l-4" style={{ borderLeftColor: s.color }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-base text-[var(--ink)]">{s.name}</h3>
                <span className="font-mono font-bold text-sm" style={{ color: s.color }}>
                  {sPct}%
                </span>
              </div>
              <div className="h-[7px] rounded-full bg-[var(--bg-sunken)] overflow-hidden mb-3">
                <div className="h-full rounded-full" style={{ width: `${sPct}%`, background: s.color, transition: 'width .6s ease' }} />
              </div>
              {subTopics.map((t) => (
                <div key={t.id} className="group flex items-center gap-2.5 py-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => toggleTopic(t)}
                    style={{ accentColor: s.color }}
                    className="w-[17px] h-[17px] flex-shrink-0"
                  />
                  <span className={`flex-1 ${t.completed ? 'text-[var(--ink-faint)] line-through' : 'text-[var(--ink)]'}`}>{t.name}</span>
                  <button
                    onClick={() => setConfirmTopic(t)}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--ink-soft)] opacity-0 group-hover:opacity-100 hover:text-danger"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setAddModalSubject(s.id)}
                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-soft)] border border-[var(--border)] rounded-lg px-3 py-1.5 hover:bg-[var(--bg-sunken)]"
              >
                <Plus className="w-3.5 h-3.5" /> Add topic
              </button>
            </div>
          );
        })}
      </div>

      <Modal open={!!addModalSubject} onClose={() => setAddModalSubject(null)} title="Add topic" maxWidth="max-w-sm">
        <form onSubmit={handleAddTopic} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink-soft)]">
            Topic name
            <input
              autoFocus
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              required
              placeholder="e.g. OSI model layers"
              className="border border-[var(--border)] rounded-lg px-3 py-2.5 bg-[var(--bg-sunken)] text-[var(--ink)] text-sm font-normal outline-none focus:border-accent"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddModalSubject(null)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--ink-soft)] border border-[var(--border)] hover:bg-[var(--bg-sunken)]"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-accent hover:bg-accent/90">
              Add topic
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmTopic}
        onClose={() => setConfirmTopic(null)}
        onConfirm={() => confirmTopic && handleDeleteTopic(confirmTopic.id)}
        text="Remove this topic from tracking?"
      />
    </div>
  );
}
