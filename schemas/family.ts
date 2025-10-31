import { z } from "zod"

export const createTripIdeaSchema = z.object({
  title: z.string().min(2, "Zadej název výletu"),
  region: z.string().min(2, "Vyber region"),
  durationH: z.number().int().min(1).max(24),
  costCZK: z.number().int().nonnegative(),
  tags: z.array(z.string().min(1)).default([]),
})

export type CreateTripIdeaInput = z.infer<typeof createTripIdeaSchema>

export const createTripSchema = z.object({
  title: z.string().min(2, "Název výletu je povinný"),
  ideaId: z.string().cuid().optional().nullable(),
  date: z.coerce.date(),
  notes: z.string().max(2000).optional().nullable(),
  budgetLimitCZK: z
    .number()
    .int()
    .min(0)
    .nullable()
    .optional(),
})

export type CreateTripInput = z.infer<typeof createTripSchema>

export const createBudgetItemSchema = z.object({
  tripId: z.string().cuid(),
  label: z.string().min(1, "Položka musí mít název"),
  amountCZK: z.number().int().min(0),
})

export type CreateBudgetItemInput = z.infer<typeof createBudgetItemSchema>

export const toggleTripCompletionSchema = z.object({
  tripId: z.string().cuid(),
  completed: z.boolean(),
})

export type ToggleTripCompletionInput = z.infer<
  typeof toggleTripCompletionSchema
>
