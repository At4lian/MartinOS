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
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { createPortal } from "react-dom"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PIPELINE_STAGES, type LeadRecord, type LeadStage } from "@/types/crm"

export interface PipelineBoardProps {
  leads: LeadRecord[]
  onStageChange: (leadId: string, stage: LeadStage) => void
  selectedLeadId: string | null
  onSelectLead: (leadId: string) => void
}

export function PipelineBoard({
  leads,
  onStageChange,
  selectedLeadId,
  onSelectLead,
}: PipelineBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )
  const [activeId, setActiveId] = useState<string | null>(null)

  const grouped = useMemo(() => {
    return PIPELINE_STAGES.map((stage) => ({
      stage: stage.value,
      label: stage.label,
      leads: leads.filter((lead) => lead.stage === stage.value),
    }))
  }, [leads])

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const leadId = event.active.id as string
    const overId = event.over?.id as LeadStage | undefined
    setActiveId(null)
    if (overId && overId !== undefined) {
      const current = leads.find((lead) => lead.id === leadId)
      const targetStage = PIPELINE_STAGES.find((stage) => stage.value === overId)
      if (targetStage && current?.stage !== targetStage.value) {
        onStageChange(leadId, targetStage.value)
      }
    }
  }

  function handleDragCancel() {
    setActiveId(null)
  }

  const activeLead = activeId ? leads.find((lead) => lead.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {grouped.map((column) => (
          <StageColumn
            key={column.stage}
            stage={column.stage}
            label={column.label}
            leads={column.leads}
            onSelectLead={onSelectLead}
            selectedLeadId={selectedLeadId}
          />
        ))}
      </div>
      {typeof document !== "undefined"
        ? createPortal(
            <DragOverlay>
              {activeLead ? (
                <LeadCard
                  lead={activeLead}
                  selected={activeLead.id === selectedLeadId}
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

interface StageColumnProps {
  stage: LeadStage
  label: string
  leads: LeadRecord[]
  onSelectLead: (leadId: string) => void
  selectedLeadId: string | null
}

function StageColumn({ stage, label, leads, onSelectLead, selectedLeadId }: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[320px] flex-col gap-3 rounded-lg border bg-muted/30 p-3 transition-colors ${isOver ? "border-primary/60 bg-primary/5" : "border-border"}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </h3>
        <Badge variant="outline">{leads.length}</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            selected={lead.id === selectedLeadId}
            onSelect={onSelectLead}
          />
        ))}
      </div>
    </div>
  )
}

interface LeadCardProps {
  lead: LeadRecord
  selected: boolean
  onSelect?: (leadId: string) => void
  dragOverlay?: boolean
}

function LeadCard({ lead, selected, onSelect, dragOverlay = false }: LeadCardProps) {
  const { setNodeRef, listeners, attributes, transform, isDragging } = useDraggable({
    id: lead.id,
  })
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab border transition-shadow hover:shadow-md ${
        selected ? "border-primary" : ""
      } ${isDragging || dragOverlay ? "opacity-80" : ""}`}
      onClick={() => onSelect?.(lead.id)}
    >
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-base">{lead.company}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {lead.contactName} · {lead.email}
        </p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Score</span>
          <span className="font-semibold text-foreground">{lead.score}</span>
        </div>
        {lead.budget !== null && lead.budget !== undefined ? (
          <div className="text-xs text-muted-foreground/80">
            Rozpočet: {lead.budget.toLocaleString("cs-CZ")} Kč
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
