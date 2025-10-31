"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import {
  createBudgetItemSchema,
  createTripIdeaSchema,
  createTripSchema,
  type CreateBudgetItemInput,
  type CreateTripIdeaInput,
  type CreateTripInput,
  toggleTripCompletionSchema,
  type ToggleTripCompletionInput,
} from "@/schemas"

const FAMILY_PATH = "/family"

export async function createTripIdeaAction(input: CreateTripIdeaInput) {
  const payload = createTripIdeaSchema.parse({
    ...input,
    tags: Array.from(
      new Set(input.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0))
    ),
  })

  await prisma.tripIdea.create({
    data: payload,
  })

  revalidatePath(FAMILY_PATH)
}

export async function createTripAction(input: CreateTripInput) {
  const payload = createTripSchema.parse(input)

  await prisma.trip.create({
    data: {
      title: payload.title,
      ideaId: payload.ideaId ?? null,
      date: payload.date,
      notes: payload.notes ?? null,
      budgetLimitCZK: payload.budgetLimitCZK ?? null,
    },
  })

  revalidatePath(FAMILY_PATH)
}

export async function addBudgetItemAction(input: CreateBudgetItemInput) {
  const payload = createBudgetItemSchema.parse(input)

  await prisma.budgetItem.create({
    data: {
      tripId: payload.tripId,
      label: payload.label,
      amountCZK: payload.amountCZK,
    },
  })

  revalidatePath(FAMILY_PATH)
}

export async function toggleTripCompletionAction(
  input: ToggleTripCompletionInput
) {
  const payload = toggleTripCompletionSchema.parse(input)

  await prisma.trip.update({
    where: { id: payload.tripId },
    data: { completed: payload.completed },
  })

  revalidatePath(FAMILY_PATH)
}
