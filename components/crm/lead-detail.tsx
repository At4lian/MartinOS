"use client"

import { startTransition, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PIPELINE_STAGES, type ActivityRecord, type LeadRecord, type LeadStage, type LeadUpdatePayload } from "@/types/crm"

export interface LeadDetailProps {
  lead: LeadRecord | null
  onUpdate: (payload: LeadUpdatePayload) => void
  onCreateActivity: (payload: { type: string; content: string }) => void
  onRecalculate: () => void
  isPending?: boolean
}

type LeadFormState = {
  company: string
  contactName: string
  email: string
  budget: string
  industry: string
  source: string
  notes: string
  stage: LeadStage
  budgetScore: string
  urgencyScore: string
  fitScore: string
  decisionMakerScore: string
  referenceScore: string
}

type ActivityFormState = {
  type: string
  content: string
}

const DEFAULT_ACTIVITY: ActivityFormState = {
  type: "Call",
  content: "",
}

export function LeadDetail({ lead, onUpdate, onCreateActivity, onRecalculate, isPending }: LeadDetailProps) {
  const [formState, setFormState] = useState<LeadFormState | null>(null)
  const [activityState, setActivityState] = useState<ActivityFormState>(DEFAULT_ACTIVITY)

  useEffect(() => {
    startTransition(() => {
      if (!lead) {
        setFormState(null)
        setActivityState({ ...DEFAULT_ACTIVITY })
        return
      }
      setFormState({
        company: lead.company,
        contactName: lead.contactName,
        email: lead.email,
        budget: lead.budget !== null && lead.budget !== undefined ? String(lead.budget) : "",
        industry: lead.industry ?? "",
        source: lead.source ?? "",
        notes: lead.notes ?? "",
        stage: lead.stage,
        budgetScore: String(lead.budgetScore),
        urgencyScore: String(lead.urgencyScore),
        fitScore: String(lead.fitScore),
        decisionMakerScore: String(lead.decisionMakerScore),
        referenceScore: String(lead.referenceScore),
      })
      setActivityState({ ...DEFAULT_ACTIVITY })
    })
  }, [lead])

  const sortedActivities = useMemo(() => {
    if (!lead) return []
    return [...lead.activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [lead])

  if (!lead || !formState) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Vyberte lead</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Klikněte na kartu v pipeline a zobrazí se detail klienta včetně historie aktivit.
          </p>
        </CardContent>
      </Card>
    )
  }

  const scoreBarWidth = Math.min(100, Math.max(0, lead.score))

  function handleFieldChange<T extends keyof LeadFormState>(field: T, value: LeadFormState[T]) {
    setFormState((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  function toNumber(value: string) {
    if (value.trim() === "") return null
    const parsed = Number(value)
    if (Number.isNaN(parsed)) return null
    return parsed
  }

  function toScore(value: string) {
    const parsed = Number(value)
    if (Number.isNaN(parsed)) return 0
    return Math.max(0, Math.min(100, Math.round(parsed)))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload: LeadUpdatePayload = {
      id: lead.id,
      company: formState.company,
      contactName: formState.contactName,
      email: formState.email,
      budget: toNumber(formState.budget),
      industry: formState.industry.trim() ? formState.industry : null,
      source: formState.source.trim() ? formState.source : null,
      notes: formState.notes.trim() ? formState.notes : null,
      stage: formState.stage,
      budgetScore: toScore(formState.budgetScore),
      urgencyScore: toScore(formState.urgencyScore),
      fitScore: toScore(formState.fitScore),
      decisionMakerScore: toScore(formState.decisionMakerScore),
      referenceScore: toScore(formState.referenceScore),
    }
    onUpdate(payload)
  }

  function handleActivitySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activityState.content.trim()) return
    onCreateActivity({
      type: activityState.type.trim(),
      content: activityState.content.trim(),
    })
    setActivityState((prev) => ({ ...prev, content: "" }))
  }

  function formatDate(value: string) {
    const date = new Date(value)
    return new Intl.DateTimeFormat("cs-CZ", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{lead.company}</span>
            <span className="text-sm font-normal text-muted-foreground">{lead.contactName}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Client Fit Score</span>
              <span className="font-semibold text-foreground">{lead.score}/100</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${scoreBarWidth}%` }} />
            </div>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Společnost">
                <Input
                  value={formState.company}
                  onChange={(event) => handleFieldChange("company", event.target.value)}
                  required
                  disabled={isPending}
                />
              </Field>
              <Field label="Kontakt">
                <Input
                  value={formState.contactName}
                  onChange={(event) => handleFieldChange("contactName", event.target.value)}
                  required
                  disabled={isPending}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={formState.email}
                  onChange={(event) => handleFieldChange("email", event.target.value)}
                  required
                  disabled={isPending}
                />
              </Field>
              <Field label="Rozpočet (Kč)">
                <Input
                  type="number"
                  value={formState.budget}
                  min={0}
                  onChange={(event) => handleFieldChange("budget", event.target.value)}
                  disabled={isPending}
                />
              </Field>
              <Field label="Segment">
                <Input
                  value={formState.industry}
                  onChange={(event) => handleFieldChange("industry", event.target.value)}
                  disabled={isPending}
                />
              </Field>
              <Field label="Zdroj">
                <Input
                  value={formState.source}
                  onChange={(event) => handleFieldChange("source", event.target.value)}
                  disabled={isPending}
                />
              </Field>
            </div>

            <Field label="Poznámky">
              <textarea
                value={formState.notes}
                onChange={(event) => handleFieldChange("notes", event.target.value)}
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isPending}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Fáze">
                <select
                  value={formState.stage}
                  onChange={(event) => handleFieldChange("stage", event.target.value as LeadStage)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={isPending}
                >
                  {PIPELINE_STAGES.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ScoreField
                  label="Rozpočet"
                  value={formState.budgetScore}
                  onChange={(value) => handleFieldChange("budgetScore", value)}
                  disabled={isPending}
                  weight={30}
                />
                <ScoreField
                  label="Urgence"
                  value={formState.urgencyScore}
                  onChange={(value) => handleFieldChange("urgencyScore", value)}
                  disabled={isPending}
                  weight={20}
                />
                <ScoreField
                  label="Fit"
                  value={formState.fitScore}
                  onChange={(value) => handleFieldChange("fitScore", value)}
                  disabled={isPending}
                  weight={20}
                />
                <ScoreField
                  label="Decision-maker"
                  value={formState.decisionMakerScore}
                  onChange={(value) => handleFieldChange("decisionMakerScore", value)}
                  disabled={isPending}
                  weight={20}
                />
                <ScoreField
                  label="Reference"
                  value={formState.referenceScore}
                  onChange={(value) => handleFieldChange("referenceScore", value)}
                  disabled={isPending}
                  weight={10}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onRecalculate} disabled={isPending}>
                Přepočítat score
              </Button>
              <Button type="submit" disabled={isPending}>
                Uložit změny
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Aktivity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-3" onSubmit={handleActivitySubmit}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Typ">
                  <Input
                    value={activityState.type}
                    onChange={(event) => setActivityState((prev) => ({ ...prev, type: event.target.value }))}
                    disabled={isPending}
                    required
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Obsah">
                    <textarea
                      value={activityState.content}
                      onChange={(event) =>
                        setActivityState((prev) => ({ ...prev, content: event.target.value }))
                      }
                      className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      disabled={isPending}
                      required
                    />
                  </Field>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  Přidat aktivitu
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {sortedActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Zatím nejsou zaznamenány žádné aktivity.</p>
              ) : (
                sortedActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} formatDate={formatDate} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Obchodní příležitosti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {lead.deals.length === 0 ? (
              <p>Žádné nabídky.</p>
            ) : (
              lead.deals.map((deal) => (
                <div key={deal.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between text-sm font-medium text-foreground">
                    <span>{deal.status}</span>
                    <span>{deal.valueCZK.toLocaleString("cs-CZ")} Kč</span>
                  </div>
                  <div className="mt-1 text-xs">
                    <div>Pravděpodobnost: {deal.probability}%</div>
                    {deal.nextStep ? <div>Další krok: {deal.nextStep}</div> : null}
                    {deal.dueDate ? <div>Termín: {formatDate(deal.dueDate)}</div> : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
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

interface ScoreFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  weight: number
}

function ScoreField({ label, value, onChange, disabled, weight }: ScoreFieldProps) {
  return (
    <Field label={`${label} (${weight}%)`}>
      <Input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </Field>
  )
}

function ActivityItem({
  activity,
  formatDate,
}: {
  activity: ActivityRecord
  formatDate: (value: string) => string
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3 shadow-sm">
      <div className="flex items-center justify-between text-sm font-medium text-foreground">
        <span>{activity.type}</span>
        <span className="text-xs text-muted-foreground">{formatDate(activity.createdAt)}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{activity.content}</p>
    </div>
  )
}
