export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-display font-bold">
            S
          </div>
          <span className="font-display font-bold text-xl text-[var(--ink)]">Study Hub</span>
        </div>
        {children}
      </div>
    </div>
  );
}
