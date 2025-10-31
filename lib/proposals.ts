import type { Proposal, PriceItem } from "@prisma/client"

import { calculateProposalTotals } from "@/lib/proposal-math"
import type { ProposalRecord, PriceItemRecord } from "@/types/proposals"

export type ProposalWithRelations = Proposal & {
  priceItems: PriceItem[]
  deal?: {
    id: string
    valueCZK: number
    status: string
  } | null
}

function toPriceItemRecord(item: PriceItem): PriceItemRecord {
  return {
    id: item.id,
    label: item.label,
    qty: item.qty,
    unitPriceCZK: item.unitPriceCZK,
    vatRate: Number(item.vatRate),
  }
}

export function serializeProposal(proposal: ProposalWithRelations): ProposalRecord {
  const priceItems = proposal.priceItems.map(toPriceItemRecord)
  const totals = calculateProposalTotals(priceItems)

  return {
    id: proposal.id,
    dealId: proposal.dealId,
    dealValueCZK: proposal.deal ? proposal.deal.valueCZK : null,
    dealStatus: proposal.deal ? proposal.deal.status : null,
    title: proposal.title,
    scopeMd: proposal.scopeMd,
    timelineMd: proposal.timelineMd,
    status: proposal.status,
    subtotalCZK: totals.subtotalCZK,
    vatCZK: totals.vatCZK,
    totalCZK: totals.totalCZK,
    marginRatio: totals.marginRatio,
    shareToken: proposal.shareToken,
    priceItems,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
  }
}
