export const PROPOSAL_STATUSES = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
] as const

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number]

export type PriceItemInput = {
  id?: string
  label: string
  qty: number
  unitPriceCZK: number
  vatRate: number
}

export type PriceItemRecord = PriceItemInput & {
  id: string
}

export type ProposalTemplate = {
  id: string
  title: string
  description?: string
  scopeMd: string
  timelineMd: string
  priceItems: PriceItemInput[]
}

export type ProposalPayload = {
  id?: string
  dealId?: string | null
  title: string
  scopeMd: string
  timelineMd: string
  status: ProposalStatus
  priceItems: PriceItemInput[]
}

export type ProposalRecord = {
  id: string
  dealId: string | null
  dealValueCZK: number | null
  dealStatus: string | null
  title: string
  scopeMd: string
  timelineMd: string
  status: ProposalStatus
  subtotalCZK: number
  vatCZK: number
  totalCZK: number
  marginRatio: number
  shareToken: string
  priceItems: PriceItemRecord[]
  createdAt: string
  updatedAt: string
}

export type ProposalSaveResponse = {
  proposal: ProposalRecord
  warnings: string[]
}
