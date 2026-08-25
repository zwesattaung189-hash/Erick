'use client';

import Modal from './Modal';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  text,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  text: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Delete this?" maxWidth="max-w-sm">
      <p className="text-sm text-[var(--ink-soft)] mb-5">{text}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--ink-soft)] border border-[var(--border)] hover:bg-[var(--bg-sunken)]"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-danger hover:bg-danger/90"
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}
