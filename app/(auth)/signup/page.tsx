'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const supabase = createClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-7 shadow-sm text-center">
        <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
        <h1 className="font-display font-bold text-lg text-[var(--ink)] mb-1">Check your email</h1>
        <p className="text-sm text-[var(--ink-soft)]">
          We sent a confirmation link to <strong>{email}</strong>. Confirm it, then log in.
        </p>
        <Link href="/login" className="inline-block mt-5 text-sm font-semibold text-accent">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-7 shadow-sm">
      <h1 className="font-display font-bold text-xl text-[var(--ink)] mb-1">Create your account</h1>
      <p className="text-sm text-[var(--ink-soft)] mb-6">Your data is private — only you can see it.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--ink-soft)]">
          Full name
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="border border-[var(--border)] rounded-lg px-3 py-2.5 bg-[var(--bg-sunken)] text-[var(--ink)] text-sm outline-none focus:border-accent"
            placeholder="Jane Doe"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--ink-soft)]">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-[var(--border)] rounded-lg px-3 py-2.5 bg-[var(--bg-sunken)] text-[var(--ink)] text-sm outline-none focus:border-accent"
            placeholder="you@example.com"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--ink-soft)]">
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-[var(--border)] rounded-lg px-3 py-2.5 bg-[var(--bg-sunken)] text-[var(--ink)] text-sm outline-none focus:border-accent"
            placeholder="At least 6 characters"
          />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex items-center justify-center gap-2 bg-accent text-white font-semibold text-sm rounded-lg py-2.5 hover:bg-accent/90 disabled:opacity-60 transition"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Sign up
        </button>
      </form>

      <p className="text-sm text-[var(--ink-soft)] mt-6 text-center">
        Already have an account?{' '}
        <Link href="/login" className="text-accent font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
