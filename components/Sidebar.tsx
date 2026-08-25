'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  NotebookPen,
  CalendarClock,
  Link2,
  Target,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/subjects', label: 'Subjects', icon: Layers },
  { href: '/notes', label: 'Notes', icon: NotebookPen },
  { href: '/schedule', label: 'Schedule', icon: CalendarClock },
  { href: '/resources', label: 'Resources', icon: Link2 },
  { href: '/progress', label: 'Progress', icon: Target },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-[232px] flex-col border-r border-[var(--border)] bg-[var(--bg-elevated)] p-4 z-20">
      <div className="flex items-center gap-2 px-2 pb-6">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white font-display font-bold text-sm">
          S
        </div>
        <span className="font-display font-bold text-lg text-[var(--ink)]">Study Hub</span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? 'bg-accent-soft text-accent font-semibold dark:bg-accent/20'
                  : 'text-[var(--ink-soft)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink)]'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border)] pt-3 flex flex-col gap-1">
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink)]"
          >
            {theme === 'dark' ? <Sun className="w-[18px] h-[18px] text-amber" /> : <Moon className="w-[18px] h-[18px]" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--ink-soft)] hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
