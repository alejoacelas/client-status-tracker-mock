export type Color = 'GRAY' | 'BLUE' | 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'PINK' | 'PURPLE'

export type FieldType =
  | 'title'
  | 'assignees'
  | 'single_select'
  | 'date'
  | 'number'
  | 'milestone'
  | 'iteration'
  | 'sub_issues_progress'
  | 'parent_issue'

export interface Option {
  id: string
  name: string
  color: Color
  description: string
}

export interface Field {
  id: string
  name: string
  type: FieldType
  options?: Option[]
}

export interface User {
  login: string
  name: string
  role: string
  color: string
}

export interface Milestone {
  id: string
  project: string
  title: string
  dueOn: string
  state: 'open' | 'closed'
  status: string
  closedOn: string | null
}

export interface Sprint {
  id: string
  title: string
  startDate: string
  duration: number
}

export interface Comment {
  author: string
  date: string
  source: string
  clientVisible: boolean
  body: string
}

export interface ItemFields {
  status?: string
  client?: string
  phase?: string
  assignees?: string[]
  start?: string
  target?: string
  progress?: number
  milestone?: string
  sprint?: string
}

export interface Item {
  id: string
  number?: number
  type: 'issue' | 'draft'
  state: 'open' | 'closed'
  repo?: string
  title: string
  createdAt: string
  author: string
  parent?: string
  closedOn?: string | null
  clientSummary?: string
  internalNotes?: string
  fields: ItemFields
  subIssues: string[]
  comments: Comment[]
}

export type Layout = 'table' | 'board' | 'roadmap'
export type Zoom = 'month' | 'quarter' | 'year'
export type SortDir = 'asc' | 'desc'

export interface SortSpec {
  field: string
  dir: SortDir
}

export interface ViewConfig {
  id: number
  name: string
  layout: Layout
  filter: string
  groupBy: string | null
  sort: SortSpec[]
  zoom: Zoom
  markers: string[]
  startField: string | null
  targetField: string | null
  fields: string[]
  truncateTitles?: boolean
  showDateFields?: boolean
  sliceBy?: string | null
}

export interface ProjectMeta {
  number: number
  title: string
  visibility: 'private' | 'public'
  status: { label: string; color: Color; date: string; body: string }
  shortDescription: string
}

export interface ProjectData {
  today: string
  org: string
  project: ProjectMeta
  users: User[]
  fields: Field[]
  milestones: Milestone[]
  sprints: Sprint[]
  items: Item[]
  views: ViewConfig[]
}
