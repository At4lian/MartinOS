"use client"

import type { DragEvent, FormEvent } from "react"
import { useState, useTransition } from "react"
import { IconGripVertical, IconTrash } from "@tabler/icons-react"

import {
  createTimebox,
  deleteTimebox,
  reorderTimeboxes,
  updateTimebox,
  type Timebox,
} from "@/actions/timebox"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const emptyForm = { title: "", start: "", end: "", vphScore: "" }

type FormState = typeof emptyForm
type EditableField = "title" | "start" | "end" | "vphScore"

type Props = {
  timeboxes: Timebox[]
}

export function TimeboxList({ timeboxes }: Props) {
  const [items, setItems] = useState<Timebox[]>(timeboxes)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isPending, startTransition] = useTransition()

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.title || !form.start || !form.end) {
      return
    }
    const payload = {
      title: form.title,
      start: form.start,
      end: form.end,
      vphScore: form.vphScore ? Number(form.vphScore) : undefined,
    }
    startTransition(async () => {
      const created = await createTimebox(payload)
      setItems((prev) => [...prev, created])
      setForm(() => ({ ...emptyForm }))
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteTimebox(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    })
  }

  const handleBlur = (id: string, field: EditableField, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) {
          return item
        }

        if (field === "vphScore") {
          if (value === "") {
            return { ...item, vphScore: undefined }
          }
          const numeric = Number(value)
          return Number.isFinite(numeric)
            ? { ...item, vphScore: numeric }
            : item
        }

        return { ...item, [field]: value }
      })
    )

    startTransition(async () => {
      if (field === "vphScore") {
        const numeric = value === "" ? undefined : Number(value)
        await updateTimebox({
          id,
          vphScore:
            typeof numeric === "number" && Number.isFinite(numeric) ? numeric : undefined,
        })
        return
      }
      const payload = {
        id,
        [field]: value,
      } as { id: string } & Partial<Pick<Timebox, EditableField>>
      await updateTimebox(payload)
    })
  }

  const [draggedId, setDraggedId] = useState<string | null>(null)

  const handleDragStart = (event: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id)
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", id)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault()
    const sourceId = draggedId ?? event.dataTransfer.getData("text/plain")
    if (!sourceId || sourceId === targetId) {
      return
    }
    setItems((prev) => {
      const next = [...prev]
      const fromIndex = next.findIndex((item) => item.id === sourceId)
      const toIndex = next.findIndex((item) => item.id === targetId)
      if (fromIndex === -1 || toIndex === -1) {
        return prev
      }
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      startTransition(async () => {
        await reorderTimeboxes(next.map((item) => item.id))
      })
      return next
    })
    setDraggedId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Timeboxing</CardTitle>
        <CardDescription>
          Plan your day, drag &amp; drop to reorder, and update slots inline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="grid gap-4 md:grid-cols-4" onSubmit={handleCreate}>
          <div className="md:col-span-2">
            <Label htmlFor="timebox-title">Title</Label>
            <Input
              id="timebox-title"
              placeholder="Deep work block"
              value={form.title}
              onChange={(event) => handleChange("title", event.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="timebox-start">Start</Label>
            <Input
              id="timebox-start"
              type="time"
              value={form.start}
              onChange={(event) => handleChange("start", event.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="timebox-end">End</Label>
            <Input
              id="timebox-end"
              type="time"
              value={form.end}
              onChange={(event) => handleChange("end", event.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="timebox-vph">VPH Score</Label>
            <Input
              id="timebox-vph"
              type="number"
              min="0"
              step="0.1"
              value={form.vphScore}
              onChange={(event) => handleChange("vphScore", event.target.value)}
            />
          </div>
          <Button className="md:col-span-4" type="submit" disabled={isPending}>
            Add Block
          </Button>
        </form>

        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No timeboxes yet. Create your first focus block.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "group flex flex-wrap items-center gap-3 rounded-lg border bg-background p-3 transition-shadow",
                  draggedId === item.id && "ring-2 ring-primary"
                )}
                draggable
                onDragStart={(event) => handleDragStart(event, item.id)}
                onDragOver={handleDragOver}
                onDrop={(event) => handleDrop(event, item.id)}
                onDragEnd={handleDragEnd}
              >
                <span className="text-muted-foreground">
                  <IconGripVertical className="size-5" />
                </span>
                <Input
                  className="w-40 flex-1 min-w-[160px]"
                  defaultValue={item.title}
                  onBlur={(event) => handleBlur(item.id, "title", event.target.value)}
                />
                <Input
                  className="w-24"
                  type="time"
                  defaultValue={item.start}
                  onBlur={(event) => handleBlur(item.id, "start", event.target.value)}
                />
                <Input
                  className="w-24"
                  type="time"
                  defaultValue={item.end}
                  onBlur={(event) => handleBlur(item.id, "end", event.target.value)}
                />
                <Input
                  className="w-24"
                  type="number"
                  min="0"
                  step="0.1"
                  defaultValue={item.vphScore ?? ""}
                  onBlur={(event) => handleBlur(item.id, "vphScore", event.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(item.id)}
                  disabled={isPending}
                >
                  <IconTrash className="size-5" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
