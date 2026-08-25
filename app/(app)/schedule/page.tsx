'use client';

import { useEffect, useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSubjects } from '@/lib/context/SubjectsContext';
import { DAYS_OF_WEEK, type ScheduleSession } from '@/lib/types';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const TODAY = DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function SchedulePage() {
  const supabase = createClient();
  const { subjects } = useSubjects();
  const [sessions, setSessions] = useState<ScheduleSession[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleSession | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [topic, setTopic] = useState('');
  const [day, setDay] = useState(TODAY);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [formError, setFormError] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function loadSessions() {
    const { data } = await supabase.from('schedule_sessions').select('*').order('start_time', { ascending: true });
    setSessions((data as ScheduleSession[]) ?? []);
  }

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function subjectName(id: string | null) {
    return subjects.find((s) => s.id === id)?.name ?? 'Unassigned';
  }
  function subjectColor(id: string | null) {
    return subjects.find((s) => s.id === id)?.color ?? '#2F5FD1';
  }

  function openNew(presetDay?: string) {
    setEditing(null);
    setSubjectId(subjects[0]?.id ?? '');
    setTopic('');
    setDay(presetDay ?? TODAY);
    setStart('');
    setEnd('');
    setFormError('');
    setModalOpen(true);
  }
  function openEdit(s: ScheduleSession) {
    setEditing(s);
    setSubjectId(s.subject_id ?? '');
    setTopic(s.topic);
    setDay(s.day_of_week);
    setStart(s.start_time.slice(0, 5));
    setEnd(s.end_time.slice(0, 5));
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!topic.trim() || !start || !end) return;
    if (end <= start) {
      setFormError('End time must be after start time.');
      return;
    }
    const payload = { subject_id: subjectId || null, topic: topic.trim(), day_of_week: day, start_time: start, end_time: end };

    if (editing) {
      const { error } = await supabase.from('schedule_sessions').update(payload).eq('id', editing.id);
      if (error) { setFormError(error.message); return; }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('schedule_sessions').insert({ ...payload, user_id: user.id });
      if (error) { setFormError(error.message); return; }
    }
    setModalOpen(false);
    loadSessions();
  }

  async function handleDelete(id: string) {
    await supabase.from('schedule_sessions').delete().eq('id', id);
    loadSessions();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--ink)]">Schedule</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">Plan your study sessions across the week.</p>
        </div>
        <button
          onClick={() => openNew()}
          className="flex items-center gap-2 bg-accent text-white text-sm font-semibold rounded-lg px-4 py-2.5 hover:bg-accent/90"
        >
          <Plus className="w-4 h-4" /> New session
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {DAYS_OF_WEEK.map((d) => {
          const items = sessions.filter((s) => s.day_of_week === d);
          return (
            <div key={d} className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-3 min-h-[160px] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className={`font-display font-bold text-xs ${d === TODAY ? 'text-accent' : 'text-[var(--ink)]'}`}>
                  {d.slice(0, 3)}
                </h4>
                <button
                  onClick={() => openNew(d)}
                  className="w-[22px] h-[22px] rounded-md border border-dashed border-[var(--border)] flex items-center justify-center text-[var(--ink-faint)] hover:text-accent hover:border-accent"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {items.length ? (
                items.map((s) => (
                  <div
                    key={s.id}
                    className="group relative bg-[var(--bg-sunken)] border-l-[3px] rounded-lg p-2 text-xs"
                    style={{ borderLeftColor: subjectColor(s.subject_id) }}
                  >
                    <time className="block font-mono text-[0.68rem] text-[var(--ink-soft)]">
                      {formatTime(s.start_time)}–{formatTime(s.end_time)}
                    </time>
                    <strong className="block text-[0.8rem] mt-0.5 text-[var(--ink)]">{s.topic}</strong>
                    <span className="text-[0.7rem] text-[var(--ink-faint)]">{subjectName(s.subject_id)}</span>
                    <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => openEdit(s)}
                        className="w-[22px] h-[22px] rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--ink-soft)]"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setConfirmId(s.id)}
                        className="w-[22px] h-[22px] rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-danger"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-[0.72rem] text-[var(--ink-faint)] py-3">No sessions</p>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit session' : 'New session'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink-soft)]">
            Subject
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="border border-[var(--border)] rounded-lg px-3 py-2.5 bg-[var(--bg-sunken)] text-[var(--ink)] text-sm font-normal outline-none focus:border-accent"
            >
              <option value="">Unassigned</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink-soft)]">
            Topic / focus
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              placeholder="e.g. Normalization forms"
              className="border border-[var(--border)] rounded-lg px-3 py-2.5 bg-[var(--bg-sunken)] text-[var(--ink)] text-sm font-normal outline-none focus:border-accent"
            />
          </label>
          <div className="flex gap-2.5">
            <label className="flex-1 flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink-soft)]">
              Day
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="border border-[var(--border)] rounded-lg px-3 py-2.5 bg-[var(--bg-sunken)] text-[var(--ink)] text-sm font-normal outline-none focus:border-accent"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex-1 flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink-soft)]">
              Start
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
                className="border border-[var(--border)] rounded-lg px-3 py-2.5 bg-[var(--bg-sunken)] text-[var(--ink)] text-sm font-normal outline-none focus:border-accent"
              />
            </label>
            <label className="flex-1 flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink-soft)]">
              End
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
                className="border border-[var(--border)] rounded-lg px-3 py-2.5 bg-[var(--bg-sunken)] text-[var(--ink)] text-sm font-normal outline-none focus:border-accent"
              />
            </label>
          </div>
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--ink-soft)] border border-[var(--border)] hover:bg-[var(--bg-sunken)]"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-accent hover:bg-accent/90">
              Save session
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && handleDelete(confirmId)}
        text="Delete this study session?"
      />
    </div>
  );
}
