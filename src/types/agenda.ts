export type EventType = 'pro' | 'personal' | 'google' | 'planity' | 'formation';
export type EventStatus = 'confirmed' | 'pending' | 'cancelled';
export type BadgeType = 'student' | 'fidele' | 'vip';
export type CalendarView = 'month' | 'week' | 'day';
export type FilterType = 'events' | 'tasks' | 'social_media';

export interface Event {
  id: string;
  user_id: string;
  type: EventType;
  title: string;
  start_at: string;
  end_at: string;
  client_id?: string;
  student_id?: string;
  service_id?: string;
  location?: string;
  notes?: string;
  status: EventStatus;
  badge_type?: BadgeType;
  source_id?: string;
  source_data?: any;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    is_fidele?: boolean;
    is_vip?: boolean;
  };
  student?: {
    id: string;
    name: string;
  };
  service?: {
    id: string;
    name: string;
    price?: number;
    duration?: number;
  };
}

export interface CalendarTask {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category?: string;
  category_tag?: string;
  priority?: string;
  scheduled_at?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  due_date?: string;
  duration_minutes?: number;
  show_in_calendar?: boolean;
  completed: boolean;
  status?: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  project_id?: string;
  collaborator_id?: string;
  production_step?: string;
  tags?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CalendarIntegration {
  id: string;
  user_id: string;
  provider: 'google' | 'planity';
  provider_account_id: string;
  is_active: boolean;
  sync_enabled: boolean;
  last_sync_at?: string;
  settings?: any;
}

export interface SocialMediaContent {
  id: string;
  user_id: string;
  title: string;
  enriched_title?: string;
  description?: string;
  content_type: string;
  platform: string[] | string;
  publication_date: string;
  publication_time?: string;
  status: 'script' | 'shooting' | 'editing' | 'scheduled' | 'published';
  image_url?: string;
  caption?: string;
  hashtags?: string;
  editorial_pillar?: string;
  objective?: 'attirer' | 'éduquer' | 'convertir' | 'fidéliser';
  script_checked?: boolean;
  tournage_checked?: boolean;
  montage_checked?: boolean;
  planifie_checked?: boolean;
  date_script?: string;
  date_shooting?: string;
  date_editing?: string;
  date_scheduling?: string;
  date_script_time?: string;
  date_shooting_time?: string;
  date_editing_time?: string;
  date_scheduling_time?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarItem {
  id: string;
  type: 'event' | 'task' | 'social_media';
  title: string;
  start: Date;
  end: Date;
  color: string;
  data: Event | CalendarTask | SocialMediaContent;
}
