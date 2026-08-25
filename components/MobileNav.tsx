'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Layers, NotebookPen, CalendarClock, Link2, Target } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/subjects', label: 'Subjects', icon: Layers },
  { href: '/notes', label: 'Notes', icon: NotebookPen },
  { href: '/schedule', label: 'Plan', icon: CalendarClock },
  { href: '/resources', label: 'Links', icon: Link2 },
  { href: '/progress', label: 'Progress', icon: Target },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--bg-elevated)] border-t border-[var(--border)] flex justify-between px-1 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))]">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[0.62rem] font-semibold ${
              active ? 'text-accent' : 'text-[var(--ink-faint)]'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
