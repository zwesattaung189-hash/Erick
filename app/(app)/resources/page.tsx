'use client';

import { useEffect, useState, FormEvent, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSubjects } from '@/lib/context/SubjectsContext';
import type { Resource } from '@/lib/types';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Plus, Search, Pencil, Trash2, Link2, FileText, Download, Loader2 } from 'lucide-react';

const BUCKET = 'resources';

export default function ResourcesPage() {
  const supabase = createClient();
  const { subjects } = useSubjects();
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function loadResources() {
    const { data } = await supabase.from('resources').select('*').order('created_at', { ascending: false });
    setResources((data as Resource[]) ?? []);
  }

  useEffect(() => {
    loadResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (filter !== 'all' && r.subject_id !== filter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return r.title.toLowerCase().includes(q) || (r.note ?? '').toLowerCase().includes(q);
    });
  }, [resources, search, filter]);

  function subjectName(id: string | null) {
    return subjects.find((s) => s.id === id)?.name ?? 'Unassigned';
  }
  function subjectColor(id: string | null) {
    return subjects.find((s) => s.id === id)?.color ?? '#2F5FD1';
  }

  function openNew() {
    setEditing(null);
    setTitle('');
    setUrl('');
    setSubjectId(subjects[0]?.id ?? '');
    setNote('');
    setFile(null);
    setFormError('');
    setModalOpen(true);
  }
  function openEdit(r: Resource) {
    setEditing(r);
    setTitle(r.title);
    setUrl(r.url ?? '');
    setSubjectId(r.subject_id ?? '');
    setNote(r.note ?? '');
    setFile(null);
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!title.trim()) return;
    if (!url.trim() && !file && !editing?.file_path) {
      setFormError('Add a link or upload a file.');
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let filePath = editing?.file_path ?? null;

    if (file) {
      setUploading(true);
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `${user.id}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      setUploading(false);
      if (uploadError) {
        setFormError(uploadError.message);
        return;
      }
      filePath = path;
    }

    const payload = {
      title: title.trim(),
      url: url.trim() || null,
      subject_id: subjectId || null,
      note: note.trim() || null,
      file_path: filePath,
    };

    if (editing) {
      const { error } = await supabase.from('resources').update(payload).eq('id', editing.id);
      if (error) { setFormError(error.message); return; }
    } else {
      const { error } = await supabase.from('resources').insert({ ...payload, user_id: user.id });
      if (error) { setFormError(error.message); return; }
    }
    setModalOpen(false);
    loadResources();
  }

  async function handleDelete(r: Resource) {
    if (r.file_path) await supabase.storage.from(BUCKET).remove([r.file_path]);
    await supabase.from('resources').delete().eq('id', r.id);
    loadResources();
  }

  async function handleDownload(r: Resource) {
    if (!r.file_path) return;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(r.file_path, 60);
    if (!error && data) window.open(data.signedUrl, '_blank');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--ink)]">Resources</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">Links and files worth coming back to.</p>
        </div>
        <button
          onClick={openNew}
          className="hidden md:flex items-center gap-2 bg-accent text-white text-sm font-semibold rounded-lg px-4 py-2.5 hover:bg-accent/90"
        >
          <Plus className="w-4 h-4" /> New resource
        </button>
      </div>

      <div className="flex flex-wrap gap-2.5 mb-5">
        <div className="flex-1 min-w-[220px] flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5">
          <Search className="w-4 h-4 text-[var(--ink-faint)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved resources…"
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

      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-[var(--ink-faint)] text-center text-sm">
          <Link2 className="w-8 h-8" />
          No resources saved yet. Add links or upload files you want to keep.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-[18px] shadow-sm flex flex-col gap-2.5 border-l-4"
            style={{ borderLeftColor: subjectColor(r.subject_id) }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="p-[7px] rounded-lg flex-shrink-0"
                style={{ color: subjectColor(r.subject_id), background: `${subjectColor(r.subject_id)}22` }}
              >
                {r.file_path ? <FileText className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              </span>
              <div>
                <h3 className="font-display font-bold text-[0.94rem] text-[var(--ink)]">{r.title}</h3>
                <span
                  className="text-[0.65rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full inline-block mt-0.5"
                  style={{ color: subjectColor(r.subject_id), background: `${subjectColor(r.subject_id)}22` }}
                >
                  {subjectName(r.subject_id)}
                </span>
              </div>
            </div>
            {r.note && <p className="text-sm text-[var(--ink-soft)]">{r.note}</p>}
            {r.url && (
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[0.8rem] text-accent break-all">
                {r.url}
              </a>
            )}
            {r.file_path && (
              <button
                onClick={() => handleDownload(r)}
                className="flex items-center gap-1.5 text-[0.8rem] text-accent font-semibold w-fit"
              >
                <Download className="w-3.5 h-3.5" /> Open file
              </button>
            )}
            <div className="flex gap-1.5 mt-1">
              <button
                onClick={() => openEdit(r)}
                className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--ink-soft)] hover:bg-[var(--bg-sunken)]"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setConfirmId(r.id)}
                className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--ink-soft)] hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit resource' : 'New resource'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink-soft)]">
            Title
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Subnetting crash course"
              className="border border-[var(--border)] rounded-lg px-3 py-2.5 bg-[var(--bg-sunken)] text-[var(--ink)] text-sm font-normal outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink-soft)]">
            Link (optional if uploading a file)
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="border border-[var(--border)] rounded-lg px-3 py-2.5 bg-[var(--bg-sunken)] text-[var(--ink)] text-sm font-normal outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink-soft)]">
            Upload a PDF or file (optional)
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-[var(--ink-soft)] font-normal file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-accent-soft file:text-accent file:font-semibold file:text-sm dark:file:bg-accent/20"
            />
            {editing?.file_path && !file && (
              <span className="text-xs text-[var(--ink-faint)]">A file is already attached. Choosing a new one replaces the reference (old file stays in storage).</span>
            )}
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
            Notes (optional)
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why this is useful"
              className="border border-[var(--border)] rounded-lg px-3 py-2.5 bg-[var(--bg-sunken)] text-[var(--ink)] text-sm font-normal outline-none focus:border-accent"
            />
          </label>
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--ink-soft)] border border-[var(--border)] hover:bg-[var(--bg-sunken)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-accent hover:bg-accent/90 disabled:opacity-60"
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save resource
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          const r = resources.find((x) => x.id === confirmId);
          if (r) handleDelete(r);
        }}
        text="Delete this resource? Any attached file will also be removed from storage."
      />
    </div>
  );
}
