"use server"

import { revalidatePath } from "next/cache"
import { promises as fs } from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"

import {
  createTimeboxSchema,
  updateTimeboxSchema,
  type TimeboxInput,
  type UpdateTimeboxInput,
} from "@/schemas"

const DATA_PATH = path.join(process.cwd(), "data", "timeboxes.json")

export type Timebox = TimeboxInput & {
  id: string
  createdAt: string
}

async function readTimeboxes(): Promise<Timebox[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8")
    const parsed = JSON.parse(raw) as Timebox[]
    return parsed
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await fs.mkdir(path.dirname(DATA_PATH), { recursive: true })
      await fs.writeFile(DATA_PATH, "[]", "utf8")
      return []
    }
    throw error
  }
}

async function writeTimeboxes(data: Timebox[]) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf8")
}

export async function getTimeboxes(): Promise<Timebox[]> {
  const timeboxes = await readTimeboxes()
  return timeboxes
}

export async function createTimebox(input: TimeboxInput) {
  const payload = createTimeboxSchema.parse(input)
  const timeboxes = await readTimeboxes()
  const record: Timebox = {
    ...payload,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  }
  timeboxes.push(record)
  await writeTimeboxes(timeboxes)
  revalidatePath("/focus")
  return record
}

export async function updateTimebox(input: UpdateTimeboxInput) {
  const payload = updateTimeboxSchema.parse(input)
  const timeboxes = await readTimeboxes()
  const index = timeboxes.findIndex((item) => item.id === payload.id)
  if (index === -1) {
    throw new Error("Timebox not found")
  }
  const updated: Timebox = {
    ...timeboxes[index],
    ...payload,
  }
  timeboxes[index] = updated
  await writeTimeboxes(timeboxes)
  revalidatePath("/focus")
  return updated
}

export async function deleteTimebox(id: string) {
  const timeboxes = await readTimeboxes()
  const filtered = timeboxes.filter((item) => item.id !== id)
  if (filtered.length === timeboxes.length) {
    throw new Error("Timebox not found")
  }
  await writeTimeboxes(filtered)
  revalidatePath("/focus")
  return id
}

export async function reorderTimeboxes(ids: string[]) {
  const timeboxes = await readTimeboxes()
  const map = new Map(timeboxes.map((item) => [item.id, item]))
  const reordered: Timebox[] = []

  ids.forEach((id) => {
    const item = map.get(id)
    if (item) {
      reordered.push(item)
      map.delete(id)
    }
  })

  map.forEach((item) => reordered.push(item))

  await writeTimeboxes(reordered)
  revalidatePath("/focus")
  return reordered
}
