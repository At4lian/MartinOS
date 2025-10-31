"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/prisma"
import { DEAL_DESK_MARGIN_THRESHOLD } from "@/lib/constants"
import { calculateProposalTotals } from "@/lib/proposal-math"
import { serializeProposal } from "@/lib/proposals"
import type { ProposalPayload, ProposalSaveResponse } from "@/types/proposals"
import { PROPOSAL_STATUSES } from "@/types/proposals"

const priceItemSchema = z.object({
  id: z.string().cuid().optional(),
  label: z.string().min(1),
  qty: z.number().int().min(1),
  unitPriceCZK: z.number().int().min(0),
  vatRate: z.number().min(0).max(1),
})

const proposalSchema = z.object({
  id: z.string().cuid().optional(),
  dealId: z.string().cuid().nullable().optional(),
  title: z.string().min(1),
  scopeMd: z.string().min(1),
  timelineMd: z.string().min(1),
  status: z.enum(PROPOSAL_STATUSES),
  priceItems: z.array(priceItemSchema).min(1),
})

export async function upsertProposalAction(
  payload: ProposalPayload,
): Promise<ProposalSaveResponse> {
  const parsed = proposalSchema.parse(payload)
  const totals = calculateProposalTotals(parsed.priceItems)

  const warnings: string[] = []
  if (totals.marginRatio < DEAL_DESK_MARGIN_THRESHOLD) {
    warnings.push(
      `Pozor: marže ${Math.round(totals.marginRatio * 100)}% je pod limitem ${Math.round(DEAL_DESK_MARGIN_THRESHOLD * 100)}%.`,
    )
  }

  if (parsed.id) {
    const existing = await db.proposal.findUnique({
      where: { id: parsed.id },
      include: { priceItems: true },
    })

    if (!existing) {
      throw new Error("Proposal not found")
    }

    const updated = await db.proposal.update({
      where: { id: parsed.id },
      data: {
        dealId: parsed.dealId ?? null,
        title: parsed.title,
        scopeMd: parsed.scopeMd,
        timelineMd: parsed.timelineMd,
        status: parsed.status,
        totalCZK: totals.totalCZK,
        priceItems: {
          deleteMany: {},
          create: parsed.priceItems.map((item) => ({
            label: item.label,
            qty: item.qty,
            unitPriceCZK: item.unitPriceCZK,
            vatRate: new Prisma.Decimal(item.vatRate),
          })),
        },
      },
      include: {
        priceItems: true,
        deal: true,
      },
    })

    const proposal = serializeProposal(updated)
    revalidatePath("/proposals")
    revalidatePath(`/p/${proposal.shareToken}`)

    return {
      proposal,
      warnings,
    }
  }

  const created = await db.proposal.create({
    data: {
      dealId: parsed.dealId ?? null,
      title: parsed.title,
      scopeMd: parsed.scopeMd,
      timelineMd: parsed.timelineMd,
      status: parsed.status,
      totalCZK: totals.totalCZK,
      shareToken: crypto.randomUUID(),
      priceItems: {
        create: parsed.priceItems.map((item) => ({
          label: item.label,
          qty: item.qty,
          unitPriceCZK: item.unitPriceCZK,
          vatRate: new Prisma.Decimal(item.vatRate),
        })),
      },
    },
    include: {
      priceItems: true,
      deal: true,
    },
  })

  const proposal = serializeProposal(created)
  revalidatePath("/proposals")
  revalidatePath(`/p/${proposal.shareToken}`)

  return {
    proposal,
    warnings,
  }
}
