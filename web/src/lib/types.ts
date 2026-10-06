export const STATUSES = ['Not started', 'On track', 'At risk', 'Blocked', 'Done'] as const;
export const PHASES = ['Discovery', 'Design', 'Build', 'Review', 'Launch'] as const;
export const MILESTONE_STATUSES = ['Not started', 'In progress', 'Done'] as const;
export const SOURCES = ['Manual', 'Email', 'Slack', 'Daily job'] as const;

export type Status = (typeof STATUSES)[number];
export type Phase = (typeof PHASES)[number];
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];
export type Source = (typeof SOURCES)[number];

export interface Client {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  share_token: string;
  created_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  status: Status;
  phase: Phase;
  owner: string | null;
  start_date: string | null;
  due_date: string | null;
  progress: number;
  client_summary: string | null;
  internal_notes: string | null;
  updated_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  due_date: string | null;
  status: MilestoneStatus;
  completed_on: string | null;
  position: number;
}

export interface Update {
  id: string;
  project_id: string;
  date: string;
  source: Source;
  summary: string;
  client_visible: boolean;
  source_ref: string | null;
  created_at: string;
}

/** Shape returned by the client_portal(p_token) database function. */
export interface Portal {
  client: string;
  contact_name: string | null;
  projects: {
    name: string;
    status: Status;
    phase: Phase;
    owner: string | null;
    start_date: string | null;
    due_date: string | null;
    progress: number;
    summary: string | null;
    updated_at: string;
    milestones: { name: string; due_date: string | null; status: MilestoneStatus; completed_on: string | null }[];
    updates: { date: string; summary: string }[];
  }[];
}
