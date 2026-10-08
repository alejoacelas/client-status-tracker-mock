import {
  ArrowBothIcon,
  CalendarIcon,
  IssueTrackedByIcon,
  IssueTracksIcon,
  IterationsIcon,
  ListUnorderedIcon,
  MilestoneIcon,
  NumberIcon,
  PeopleIcon,
  SingleSelectIcon,
} from '@primer/octicons-react'
import { FIELDS } from '../store'

export function FieldIcon({ fieldId, size = 16 }: { fieldId: string; size?: number }) {
  const f = FIELDS.find((x) => x.id === fieldId)
  switch (f?.type) {
    case 'title':
      return <ListUnorderedIcon size={size} />
    case 'assignees':
      return <PeopleIcon size={size} />
    case 'single_select':
      return <SingleSelectIcon size={size} />
    case 'date':
      return <CalendarIcon size={size} />
    case 'number':
      return <NumberIcon size={size} />
    case 'milestone':
      return <MilestoneIcon size={size} />
    case 'iteration':
      return <IterationsIcon size={size} />
    case 'sub_issues_progress':
      return <IssueTrackedByIcon size={size} />
    case 'parent_issue':
      return <IssueTracksIcon size={size} />
  }
  return null
}

export function fieldName(id: string) {
  return FIELDS.find((f) => f.id === id)?.name ?? id
}

/** Vertical double arrow used for "Sort" in the toolbar and view menu. */
export function SortIcon({ size = 16 }: { size?: number }) {
  return (
    <span className="rotate90" style={{ display: 'inline-flex' }}>
      <ArrowBothIcon size={size} />
    </span>
  )
}
