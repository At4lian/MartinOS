export type LeadStage =
  | "LEAD"
  | "KVALIFIKACE"
  | "NAVRH"
  | "JEDNANI"
  | "VYHRANO"
  | "PROHRANO"

type StageMeta = {
  value: LeadStage
  label: string
}

export const PIPELINE_STAGES: StageMeta[] = [
  { value: "LEAD", label: "Lead" },
  { value: "KVALIFIKACE", label: "Kvalifikace" },
  { value: "NAVRH", label: "Návrh" },
  { value: "JEDNANI", label: "Jednání" },
  { value: "VYHRANO", label: "Vyhráno" },
  { value: "PROHRANO", label: "Prohráno" },
]

export const PIPELINE_LABEL_BY_STAGE: Record<LeadStage, string> = PIPELINE_STAGES.reduce(
  (acc, stage) => {
    acc[stage.value] = stage.label
    return acc
  },
  {} as Record<LeadStage, string>,
)

export interface ActivityRecord {
  id: string
  leadId: string | null
  dealId: string | null
  type: string
  content: string
  createdAt: string
}

export interface DealRecord {
  id: string
  leadId: string
  valueCZK: number
  status: string
  probability: number
  nextStep: string | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export interface LeadRecord {
  id: string
  company: string
  contactName: string
  email: string
  budget: number | null
  industry: string | null
  source: string | null
  stage: LeadStage
  score: number
  notes: string | null
  budgetScore: number
  urgencyScore: number
  fitScore: number
  decisionMakerScore: number
  referenceScore: number
  createdAt: string
  updatedAt: string
  deals: DealRecord[]
  activities: ActivityRecord[]
}

export type LeadUpdatePayload = {
  id: string
  company: string
  contactName: string
  email: string
  budget: number | null
  industry: string | null
  source: string | null
  notes: string | null
  budgetScore: number
  urgencyScore: number
  fitScore: number
  decisionMakerScore: number
  referenceScore: number
  stage: LeadStage
}

export type LeadCreatePayload = Omit<LeadUpdatePayload, "id">

export type ActivityCreatePayload = {
  leadId: string
  dealId?: string | null
  type: string
  content: string
}

export type DealUpsertPayload = {
  id?: string
  leadId: string
  valueCZK: number
  status: string
  probability: number
  nextStep: string | null
  dueDate: string | null
}
