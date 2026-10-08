export type ColumnId = 'now' | 'next' | 'later';
export type Placement = ColumnId | 'completed' | 'candidate';
export type Stage = 'completed' | 'roadmap' | 'candidates';

export interface Staff { id: string; name: string; role: string; initials: string; email: string }
export interface ProductLine { id: string; name: string; contact: string; contactEmail: string; shareToken: string }
export interface Product {
  id: string; line: string; name: string; status: string; phase: string; owner: string;
  startDate: string; dueDate: string; progress: number; color: string;
  clientSummary: string; internalNotes: string;
}
export interface Objective { id: string; name: string; color: number; line: string | null }
export interface Idea { id: number; title: string; stage: string }
export interface Update { date: string; source: string; clientVisible: boolean; author: string; text: string }
export interface Initiative {
  id: string; product: string; column: Placement; order: number;
  title: string; description: string; targetOutcomes?: string; outcome?: string;
  objectives: string[]; tags: string[]; owners: string[];
  visibility: 'public' | 'internal';
  targetDate?: string; completedOn?: string; milestoneStatus: string;
  impact: number; effort: number; dateAdded: string; lastUpdated: string;
  blockedBy?: string[]; externalDependency?: string; internalNote?: string;
  ideas: Idea[]; updates: Update[];
}
export interface Column { id: ColumnId; title: string; description: string }
export interface PublishedRoadmap { token: string; line: string; name: string; description: string; createdBy: string; lastUpdated: string }
export interface RoadmapData {
  agency: string; today: string;
  staff: Staff[]; productLines: ProductLine[]; products: Product[];
  objectives: Objective[]; tags: string[]; workflowStages: string[];
  columns: Column[]; initiatives: Initiative[]; publishedRoadmaps: PublishedRoadmap[];
}

export type ViewPreset = 'collapsed' | 'expanded' | 'detailed';
export interface DisplayOptions {
  preset: ViewPreset;
  columnDescription: boolean;
  objectives: boolean;
  description: boolean;
  tags: boolean;
  targetDate: boolean;
  ideas: boolean;
  owners: boolean;
  productName: boolean;
  visibility: boolean;
}
export interface Filters {
  search: string;
  objectives: string[];
  owners: string[];
  lines: string[];
  products: string[];
  columns: ColumnId[];
  tags: string[];
  visibility: '' | 'public' | 'internal';
}
