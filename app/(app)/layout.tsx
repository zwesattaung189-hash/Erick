import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SubjectsProvider } from '@/lib/context/SubjectsContext';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <SubjectsProvider>
      <Sidebar />
      <MobileNav />
      <div className="md:ml-[232px] min-h-screen pb-24 md:pb-8">
        <div className="max-w-[1180px] mx-auto px-4 md:px-8 py-6 md:py-8">{children}</div>
      </div>
    </SubjectsProvider>
  );
}
