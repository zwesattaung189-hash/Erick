'use client';

import { useEffect, useState, FormEvent, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSubjects } from '@/lib/context/SubjectsContext';
import type { Note } from '@/lib/types';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Plus, Search, Pencil, Trash2, NotebookPen } from 'lucide-react';

export default function NotesPage() {
  const supabase = createClient();
  const { subjects } = useSubjects();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function loadNotes() {
    setLoading(true);
    const { data } = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
    setNotes((data as Note[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      if (filter !== 'all' && n.subject_id !== filter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    });
  }, [notes, search, filter]);

  function subjectName(id: string | null) {
    return subjects.find((s) => s.id === id)?.name ?? 'Unassigned';
  }
  function subjectColor(id: string | null) {
    return subjects.find((s) => s.id === id)?.color ?? '#2F5FD1';
  }

  function openNew() {
    setEditing(null);
    setTitle('');
    setContent('');
    setSubjectId(subjects[0]?.id ?? '');
    setModalOpen(true);
  }
  function openEdit(n: Note) {
    setEditing(n);
    setTitle(n.title);
    setContent(n.content);
    setSubjectId(n.subject_id ?? '');
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (editing) {
      await supabase.from('notes').update({ title, content, subject_id: subjectId || null }).eq('id', editing.id);
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('notes').insert({ user_id: user.id, title, content, subject_id: subjectId || null });
    }
    setModalOpen(false);
    loadNotes();
  }

  async function handleDelete(id: string) {
    await supabase.from('notes').delete().eq('id', id);
    loadNotes();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--ink)]">Notes</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">Write, search, and revisit what you&apos;ve learned.</p>
        </div>
        <button
          onClick={openNew}
          className="hidden md:flex items-center gap-2 bg-accent text-white text-sm font-semibold rounded-lg px-4 py-2.5 hover:bg-accent/90"
        >
          <Plus className="w-4 h-4" /> New note
        </button>
      </div>

      <div className="flex flex-wrap gap-2.5 mb-5">
        <div className="flex-1 min-w-[220px] flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5">
          <Search className="w-4 h-4 text-[var(--ink-faint)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes by title or content…"
            className="bg-transparent outline-none text-sm w-full text-[var(--ink)]"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--ink)]"
        >
          <option value="all">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          onClick={openNew}
          className="md:hidden flex items-center gap-2 bg-accent text-white text-sm font-semibold rounded-lg px-4 py-2.5"
        >
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-[var(--ink-faint)] text-center text-sm">
          <NotebookPen className="w-8 h-8" />
          No notes yet. Start writing — your first note is one click away.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((n) => (
          <div
            key={n.id}
            className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-4.5 p-[18px] shadow-sm flex flex-col gap-2.5 border-l-4"
            style={{ borderLeftColor: subjectColor(n.subject_id) }}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-bold text-[0.98rem] text-[var(--ink)]">{n.title}</h3>
              <span
                className="text-[0.65rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{ color: subjectColor(n.subject_id), background: `${subjectColor(n.subject_id)}22` }}
              >
                {subjectName(n.subject_id)}
              </span>
            </div>
            <p className="text-sm text-[var(--ink-soft)] leading-relaxed line-clamp-4 flex-1">{n.content}</p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.7rem] text-[var(--ink-faint)]">
                Updated {new Date(n.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => openEdit(n)}
                  className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--ink-soft)] hover:bg-[var(--bg-sunken)]"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfirmId(n.id)}
                  className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--ink-soft)] hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit note' : 'New note'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink-soft)]">
            Title
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. TCP handshake steps"
              className="border border-[var(--border)] rounded-lg px-3 py-2.5 bg-[var(--bg-sunken)] text-[var(--ink)] text-sm font-normal outline-none focus:border-accent"
            />
          </label>
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
            Content
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={8}
              placeholder="Write your notes here…"
              className="border border-[var(--border)] rounded-lg px-3 py-2.5 bg-[var(--bg-sunken)] text-[var(--ink)] text-sm font-normal outline-none focus:border-accent resize-y"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--ink-soft)] border border-[var(--border)] hover:bg-[var(--bg-sunken)]"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-accent hover:bg-accent/90">
              Save note
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && handleDelete(confirmId)}
        text="Delete this note? This can't be undone."
      />
    </div>
  );
}
