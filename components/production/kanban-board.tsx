"use client"

import { useMemo, useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { createPortal } from "react-dom"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PRODUCTION_STATUSES,
  PRODUCTION_STATUS_LABEL,
  type ProductionStatus,
  type Project,
} from "@/types/production"

interface KanbanBoardProps {
  projects: Project[]
  onStatusChange: (projectId: string, status: ProductionStatus) => void
  selectedProjectId: string | null
  onSelectProject: (projectId: string) => void
}

export function KanbanBoard({
  projects,
  onStatusChange,
  selectedProjectId,
  onSelectProject,
}: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )
  const [activeId, setActiveId] = useState<string | null>(null)

  const columns = useMemo(
    () =>
      PRODUCTION_STATUSES.map((status) => ({
        status: status.value,
        label: status.label,
        projects: projects.filter((project) => project.status === status.value),
      })),
    [projects],
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const projectId = event.active.id as string
    const nextStatus = event.over?.id as ProductionStatus | undefined
    setActiveId(null)

    if (!nextStatus) return

    const current = projects.find((project) => project.id === projectId)
    if (current && current.status !== nextStatus) {
      onStatusChange(projectId, nextStatus)
    }
  }

  function handleDragCancel() {
    setActiveId(null)
  }

  const activeProject = activeId ? projects.find((project) => project.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <StatusColumn
            key={column.status}
            status={column.status}
            label={column.label}
            projects={column.projects}
            onSelectProject={onSelectProject}
            selectedProjectId={selectedProjectId}
          />
        ))}
      </div>
      {typeof document !== "undefined"
        ? createPortal(
            <DragOverlay>
              {activeProject ? (
                <ProjectCard
                  project={activeProject}
                  selected={activeProject.id === selectedProjectId}
                  dragOverlay
                />
              ) : null}
            </DragOverlay>,
            document.body,
          )
        : null}
    </DndContext>
  )
}

interface StatusColumnProps {
  status: ProductionStatus
  label: string
  projects: Project[]
  onSelectProject: (projectId: string) => void
  selectedProjectId: string | null
}

function StatusColumn({
  status,
  label,
  projects,
  onSelectProject,
  selectedProjectId,
}: StatusColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[320px] flex-col gap-3 rounded-lg border bg-muted/30 p-3 transition-colors ${
        isOver ? "border-primary/60 bg-primary/5" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </h3>
        <Badge variant="outline">{projects.length}</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            selected={project.id === selectedProjectId}
            onSelect={onSelectProject}
          />
        ))}
      </div>
    </div>
  )
}

interface ProjectCardProps {
  project: Project
  selected: boolean
  onSelect?: (projectId: string) => void
  dragOverlay?: boolean
}

function ProjectCard({ project, selected, onSelect, dragOverlay = false }: ProjectCardProps) {
  const { setNodeRef, listeners, attributes, transform, isDragging } = useDraggable({
    id: project.id,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  const dueDate = new Date(project.dueDate)
  const formattedDueDate = Number.isNaN(dueDate.getTime())
    ? project.dueDate
    : new Intl.DateTimeFormat("cs-CZ", {
        month: "short",
        day: "numeric",
      }).format(dueDate)

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab border transition-shadow hover:shadow-md ${
        selected ? "border-primary" : ""
      } ${isDragging || dragOverlay ? "opacity-80" : ""}`}
      onClick={() => onSelect?.(project.id)}
    >
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-base">{project.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{project.client}</p>
      </CardHeader>
      <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{PRODUCTION_STATUS_LABEL[project.status]}</span>
        <span className="font-medium text-foreground">{formattedDueDate}</span>
      </CardContent>
    </Card>
  )
}
