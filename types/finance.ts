export const FINANCE_RECORD_TYPES = ["income", "expense"] as const

export type FinanceRecordType = (typeof FINANCE_RECORD_TYPES)[number]

export type FinanceRecordInput = {
  date: string
  type: FinanceRecordType
  label: string
  amountCZK: number
  dealId?: string | null
}

export type FinanceRecordItem = {
  id: string
  date: string
  type: FinanceRecordType
  label: string
  amountCZK: number
  dealId: string | null
  dealLeadCompany: string | null
  dealStatus: string | null
  dealValueCZK: number | null
}

export type FinanceTotals = {
  income: number
  expense: number
  profit: number
  monthlyRunRate: number
}

export type FinanceMonthlySummary = {
  month: string
  income: number
  expense: number
  profit: number
}

export type FinanceDealSummary = {
  id: string
  leadCompany: string | null
  status: string
  valueCZK: number
}

export type FinanceDealMargin = {
  dealId: string
  leadCompany: string | null
  status: string
  valueCZK: number
  income: number
  expense: number
  profit: number
  marginRatio: number | null
}

export type FinanceDashboardData = {
  records: FinanceRecordItem[]
  totals: FinanceTotals
  monthlySummaries: FinanceMonthlySummary[]
  dealMargins: FinanceDealMargin[]
  deals: FinanceDealSummary[]
}
