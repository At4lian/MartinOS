import { z } from "zod"

export const timeboxBaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  start: z.string().min(1, "Start time is required"),
  end: z.string().min(1, "End time is required"),
  vphScore: z
    .number()
    .min(0, "vphScore must be positive")
    .optional(),
})

export const createTimeboxSchema = timeboxBaseSchema

export const updateTimeboxSchema = timeboxBaseSchema.partial().extend({
  id: z.string().min(1, "Timebox id is required"),
})

export type TimeboxInput = z.infer<typeof timeboxBaseSchema>
export type UpdateTimeboxInput = z.infer<typeof updateTimeboxSchema>
