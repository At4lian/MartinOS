"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/prisma"
import {
  type ActivityCreatePayload,
  type DealUpsertPayload,
  type LeadCreatePayload,
  type LeadRecord,
  type LeadStage,
  type LeadUpdatePayload,
  PIPELINE_LABEL_BY_STAGE,
  PIPELINE_STAGES,
} from "@/types/crm"

const numericScore = z.number().int().min(0).max(100)

const leadUpdateSchema = z.object({
  id: z.string().cuid(),
  company: z.string().min(1),
  contactName: z.string().min(1),
  email: z.string().email(),
  budget: z.number().int().min(0).nullable(),
  industry: z.string().nullable(),
  source: z.string().nullable(),
  notes: z.string().nullable(),
  stage: z.enum([
    "LEAD",
    "KVALIFIKACE",
    "NAVRH",
    "JEDNANI",
    "VYHRANO",
    "PROHRANO",
  ] satisfies LeadStage[]),
  budgetScore: numericScore,
  urgencyScore: numericScore,
  fitScore: numericScore,
  decisionMakerScore: numericScore,
  referenceScore: numericScore,
})

const leadCreateSchema = leadUpdateSchema.omit({ id: true })

const activityCreateSchema = z.object({
  leadId: z.string().cuid(),
  dealId: z.string().cuid().nullable().optional(),
  type: z.string().min(1),
  content: z.string().min(1),
})

const dealPayloadSchema = z.object({
  id: z.string().cuid().optional(),
  leadId: z.string().cuid(),
  valueCZK: z.number().int().min(0),
  status: z.string().min(1),
  probability: z.number().int().min(0).max(100),
  nextStep: z.string().nullable(),
  dueDate: z.string().nullable(),
})

function calculateLeadScore(input: {
  budgetScore: number
  urgencyScore: number
  fitScore: number
  decisionMakerScore: number
  referenceScore: number
}) {
  const total =
    input.budgetScore * 0.3 +
    input.urgencyScore * 0.2 +
    input.fitScore * 0.2 +
    input.decisionMakerScore * 0.2 +
    input.referenceScore * 0.1
  return Math.round(total)
}

function ensureStage(stage: LeadStage) {
  if (!PIPELINE_LABEL_BY_STAGE[stage]) {
    throw new Error(`Unknown stage: ${stage}`)
  }
  return stage
}

type LeadWithRelations = Prisma.LeadGetPayload<{
  include: { deals: true; activities: true }
}>

function serializeLead(lead: LeadWithRelations): LeadRecord {
  return {
    id: lead.id,
    company: lead.company,
    contactName: lead.contactName,
    email: lead.email,
    budget: lead.budget,
    industry: lead.industry,
    source: lead.source,
    stage: ensureStage(lead.stage),
    score: lead.score,
    notes: lead.notes,
    budgetScore: lead.budgetScore,
    urgencyScore: lead.urgencyScore,
    fitScore: lead.fitScore,
    decisionMakerScore: lead.decisionMakerScore,
    referenceScore: lead.referenceScore,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    deals: lead.deals.map((deal) => ({
      id: deal.id,
      leadId: deal.leadId,
      valueCZK: deal.valueCZK,
      status: deal.status,
      probability: deal.probability,
      nextStep: deal.nextStep,
      dueDate: deal.dueDate ? deal.dueDate.toISOString() : null,
      createdAt: deal.createdAt.toISOString(),
      updatedAt: deal.updatedAt.toISOString(),
    })),
    activities: lead.activities
      .map((activity) => ({
        id: activity.id,
        leadId: activity.leadId,
        dealId: activity.dealId,
        type: activity.type,
        content: activity.content,
        createdAt: activity.createdAt.toISOString(),
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  }
}

export async function getCrmLeads(): Promise<LeadRecord[]> {
  const leads = await db.lead.findMany({
    include: {
      deals: true,
      activities: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  })

  return leads.map((lead) => serializeLead(lead))
}

export async function createLeadAction(payload: LeadCreatePayload) {
  const parsed = leadCreateSchema.parse(payload)
  const score = calculateLeadScore(parsed)

  const created = await db.lead.create({
    data: {
      company: parsed.company,
      contactName: parsed.contactName,
      email: parsed.email,
      budget: parsed.budget,
      industry: parsed.industry,
      source: parsed.source,
      notes: parsed.notes,
      stage: parsed.stage,
      budgetScore: parsed.budgetScore,
      urgencyScore: parsed.urgencyScore,
      fitScore: parsed.fitScore,
      decisionMakerScore: parsed.decisionMakerScore,
      referenceScore: parsed.referenceScore,
      score,
    },
    include: {
      deals: true,
      activities: true,
    },
  })
  revalidatePath("/crm")
  return serializeLead(created)
}

export async function moveLeadStageAction(input: {
  id: string
  stage: LeadStage
}) {
  const stage = ensureStage(input.stage)
  const updated = await db.lead.update({
    where: { id: input.id },
    data: { stage },
    include: {
      deals: true,
      activities: true,
    },
  })
  revalidatePath("/crm")
  return serializeLead(updated)
}

export async function updateLeadAction(payload: LeadUpdatePayload) {
  const parsed = leadUpdateSchema.parse(payload)
  const score = calculateLeadScore(parsed)

  const updated = await db.lead.update({
    where: { id: parsed.id },
    data: {
      company: parsed.company,
      contactName: parsed.contactName,
      email: parsed.email,
      budget: parsed.budget,
      industry: parsed.industry,
      source: parsed.source,
      notes: parsed.notes,
      stage: parsed.stage,
      budgetScore: parsed.budgetScore,
      urgencyScore: parsed.urgencyScore,
      fitScore: parsed.fitScore,
      decisionMakerScore: parsed.decisionMakerScore,
      referenceScore: parsed.referenceScore,
      score,
    },
    include: {
      deals: true,
      activities: true,
    },
  })
  revalidatePath("/crm")
  return serializeLead(updated)
}

export async function createActivityAction(payload: ActivityCreatePayload) {
  const parsed = activityCreateSchema.parse({
    ...payload,
    dealId: payload.dealId ?? null,
  })

  const activity = await db.activity.create({
    data: {
      leadId: parsed.leadId,
      dealId: parsed.dealId ?? undefined,
      type: parsed.type,
      content: parsed.content,
    },
  })

  revalidatePath("/crm")

  return {
    id: activity.id,
    leadId: activity.leadId,
    dealId: activity.dealId,
    type: activity.type,
    content: activity.content,
    createdAt: activity.createdAt.toISOString(),
  }
}

export async function recalculateLeadScoreAction(id: string) {
  const lead = await db.lead.findUnique({
    where: { id },
    include: { deals: true, activities: true },
  })
  if (!lead) {
    throw new Error("Lead not found")
  }

  const score = calculateLeadScore({
    budgetScore: lead.budgetScore,
    urgencyScore: lead.urgencyScore,
    fitScore: lead.fitScore,
    decisionMakerScore: lead.decisionMakerScore,
    referenceScore: lead.referenceScore,
  })

  const updated = await db.lead.update({
    where: { id },
    data: { score },
    include: { deals: true, activities: true },
  })

  revalidatePath("/crm")
  return serializeLead(updated)
}

export async function getCrmStageValues() {
  return PIPELINE_STAGES.map((stage) => stage.value)
}

export async function deleteLeadAction(id: string) {
  await db.lead.delete({ where: { id } })
  revalidatePath("/crm")
  return id
}

function parseDueDate(input: string | null) {
  if (!input) return null
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid due date")
  }
  return date
}

export async function upsertDealAction(payload: DealUpsertPayload) {
  const parsed = dealPayloadSchema.parse(payload)
  const data = {
    leadId: parsed.leadId,
    valueCZK: parsed.valueCZK,
    status: parsed.status,
    probability: parsed.probability,
    nextStep: parsed.nextStep,
    dueDate: parseDueDate(parsed.dueDate),
  }

  const deal = parsed.id
    ? await db.deal.update({
        where: { id: parsed.id },
        data,
      })
    : await db.deal.create({
        data,
      })

  revalidatePath("/crm")

  return {
    id: deal.id,
    leadId: deal.leadId,
    valueCZK: deal.valueCZK,
    status: deal.status,
    probability: deal.probability,
    nextStep: deal.nextStep,
    dueDate: deal.dueDate ? deal.dueDate.toISOString() : null,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
  }
}

export async function deleteDealAction(id: string) {
  await db.deal.delete({ where: { id } })
  revalidatePath("/crm")
  return id
}
