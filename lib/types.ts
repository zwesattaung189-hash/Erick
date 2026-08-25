export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Topic {
  id: string;
  user_id: string;
  subject_id: string;
  name: string;
  completed: boolean;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleSession {
  id: string;
  user_id: string;
  subject_id: string | null;
  topic: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface Resource {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  url: string | null;
  file_path: string | null;
  note: string | null;
  created_at: string;
}

export const SUBJECT_COLORS = [
  '#2F5FD1',
  '#8A4FE0',
  '#E8A93B',
  '#3FA66B',
  '#D65F87',
  '#1FA6A6',
  '#C9694E',
];

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
