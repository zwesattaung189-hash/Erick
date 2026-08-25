'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Subject } from '@/lib/types';

interface SubjectsContextValue {
  subjects: Subject[];
  loading: boolean;
  refreshSubjects: () => Promise<void>;
}

const SubjectsContext = createContext<SubjectsContextValue>({
  subjects: [],
  loading: true,
  refreshSubjects: async () => {},
});

export function SubjectsProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSubjects = useCallback(async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) setSubjects(data as Subject[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refreshSubjects();
  }, [refreshSubjects]);

  return (
    <SubjectsContext.Provider value={{ subjects, loading, refreshSubjects }}>
      {children}
    </SubjectsContext.Provider>
  );
}

export function useSubjects() {
  return useContext(SubjectsContext);
}
