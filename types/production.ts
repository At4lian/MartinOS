export type ProductionStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"

export interface Project {
  id: string
  title: string
  client: string
  status: ProductionStatus
  dueDate: string
}

export type AssetKind = "image" | "video" | "other"

export interface Asset {
  id: string
  projectId: string
  kind: AssetKind
  url: string
  note: string | null
  version: number
}

export interface ChecklistItem {
  id: string
  projectId: string
  title: string
  done: boolean
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  checklist: string[]
}

export const PRODUCTION_STATUSES: { value: ProductionStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "REVIEW", label: "Review" },
  { value: "DONE", label: "Done" },
]

export const PRODUCTION_STATUS_LABEL: Record<ProductionStatus, string> =
  Object.fromEntries(PRODUCTION_STATUSES.map((status) => [status.value, status.label])) as Record<ProductionStatus, string>
