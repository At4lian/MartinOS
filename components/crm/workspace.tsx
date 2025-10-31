"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

import {
  createActivityAction,
  createLeadAction,
  deleteLeadAction,
  moveLeadStageAction,
  recalculateLeadScoreAction,
  updateLeadAction,
} from "@/actions/crm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type LeadCreatePayload, type LeadRecord, type LeadStage, type LeadUpdatePayload } from "@/types/crm"

import { LeadDetail } from "./lead-detail"
import { PipelineBoard } from "./pipeline-board"

interface CrmWorkspaceProps {
  initialLeads: LeadRecord[]
}

type LeadDraftState = {
  company: string
  contactName: string
  email: string
}

const DEFAULT_LEAD: LeadDraftState = {
  company: "",
  contactName: "",
  email: "",
}

export function CrmWorkspace({ initialLeads }: CrmWorkspaceProps) {
  const [leads, setLeads] = useState<LeadRecord[]>(initialLeads)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(
    initialLeads[0]?.id ?? null,
  )
  const [isPending, startTransition] = useTransition()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [draft, setDraft] = useState(DEFAULT_LEAD)

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId],
  )

  function updateLeadState(updated: LeadRecord) {
    setLeads((prev) => prev.map((lead) => (lead.id === updated.id ? updated : lead)))
    setSelectedLeadId((prev) => prev ?? updated.id)
  }

  function handleStageChange(leadId: string, stage: LeadStage) {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, stage } : lead)),
    )
    startTransition(async () => {
      try {
        const updated = await moveLeadStageAction({ id: leadId, stage })
        updateLeadState(updated)
        toast.success("Fáze byla aktualizována")
      } catch (error) {
        console.error(error)
        toast.error("Nepodařilo se uložit změnu fáze")
      }
    })
  }

  function handleUpdateLead(payload: LeadUpdatePayload) {
    startTransition(async () => {
      try {
        const updated = await updateLeadAction(payload)
        updateLeadState(updated)
        toast.success("Lead byl uložen")
      } catch (error) {
        console.error(error)
        toast.error("Uložení leadu selhalo")
      }
    })
  }

  function handleCreateActivity(input: { type: string; content: string }) {
    if (!selectedLeadId) return
    startTransition(async () => {
      try {
        const activity = await createActivityAction({
          leadId: selectedLeadId,
          type: input.type,
          content: input.content,
        })
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === selectedLeadId
              ? { ...lead, activities: [activity, ...lead.activities] }
              : lead,
          ),
        )
        toast.success("Aktivita byla přidána")
      } catch (error) {
        console.error(error)
        toast.error("Aktivitu se nepodařilo uložit")
      }
    })
  }

  function handleRecalculate() {
    if (!selectedLeadId) return
    startTransition(async () => {
      try {
        const updated = await recalculateLeadScoreAction(selectedLeadId)
        updateLeadState(updated)
        toast.success("Score bylo přepočítáno")
      } catch (error) {
        console.error(error)
        toast.error("Nepodařilo se přepočítat score")
      }
    })
  }

  function resetDraft() {
    setDraft(DEFAULT_LEAD)
  }

  function handleCreateLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload: LeadCreatePayload = {
      company: draft.company,
      contactName: draft.contactName,
      email: draft.email,
      budget: null,
      industry: null,
      source: null,
      notes: null,
      stage: "LEAD",
      budgetScore: 0,
      urgencyScore: 0,
      fitScore: 0,
      decisionMakerScore: 0,
      referenceScore: 0,
    }
    startTransition(async () => {
      try {
        const created = await createLeadAction(payload)
        setLeads((prev) => [created, ...prev])
        setSelectedLeadId(created.id)
        toast.success("Lead byl vytvořen")
        setShowCreateForm(false)
        resetDraft()
      } catch (error) {
        console.error(error)
        toast.error("Vytvoření leadu selhalo")
      }
    })
  }

  async function handleDeleteLead() {
    if (!selectedLeadId) return
    startTransition(async () => {
      try {
        await deleteLeadAction(selectedLeadId)
        setLeads((prev) => {
          const filtered = prev.filter((lead) => lead.id !== selectedLeadId)
          setSelectedLeadId((current) => {
            if (!filtered.length) return null
            if (!current || current === selectedLeadId) {
              return filtered[0].id
            }
            return current
          })
          return filtered
        })
        toast.success("Lead byl odstraněn")
      } catch (error) {
        console.error(error)
        toast.error("Smazání leadu selhalo")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Sledujte průběh obchodních příležitostí a priorizujte nejlepší leady.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() =>
              setShowCreateForm((prev) => {
                const next = !prev
                if (next) {
                  resetDraft()
                }
                return next
              })
            }
          >
            {showCreateForm ? "Zavřít" : "Nový lead"}
          </Button>
          {selectedLead ? (
            <Button variant="outline" onClick={handleDeleteLead} disabled={isPending}>
              Smazat lead
            </Button>
          ) : null}
        </div>
      </div>

      {showCreateForm ? (
        <form
          className="grid gap-4 rounded-lg border border-dashed border-border bg-muted/20 p-4 md:grid-cols-3"
          onSubmit={handleCreateLead}
        >
          <Field label="Společnost">
            <Input
              value={draft.company}
              onChange={(event) => setDraft((prev) => ({ ...prev, company: event.target.value }))}
              required
            />
          </Field>
          <Field label="Kontakt">
            <Input
              value={draft.contactName}
              onChange={(event) => setDraft((prev) => ({ ...prev, contactName: event.target.value }))}
              required
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={draft.email}
              onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </Field>
          <div className="md:col-span-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowCreateForm(false)
                resetDraft()
              }}
            >
              Zrušit
            </Button>
            <Button type="submit" disabled={isPending}>
              Uložit lead
            </Button>
          </div>
        </form>
      ) : null}

      <PipelineBoard
        leads={leads}
        onStageChange={handleStageChange}
        selectedLeadId={selectedLeadId}
        onSelectLead={setSelectedLeadId}
      />

      <LeadDetail
        lead={selectedLead}
        onUpdate={handleUpdateLead}
        onCreateActivity={handleCreateActivity}
        onRecalculate={handleRecalculate}
        isPending={isPending}
      />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-medium uppercase text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
