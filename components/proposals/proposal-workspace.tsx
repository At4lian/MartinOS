"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { upsertProposalAction } from "@/actions/proposals"
import { DEAL_DESK_MARGIN_THRESHOLD, DEFAULT_VAT_RATE } from "@/lib/constants"
import { formatCurrencyCZK, formatPercent } from "@/lib/format"
import { markdownToHtml } from "@/lib/markdown"
import { calculateProposalTotals } from "@/lib/proposal-math"
import type {
  PriceItemInput,
  ProposalPayload,
  ProposalRecord,
  ProposalTemplate,
} from "@/types/proposals"
import { PROPOSAL_STATUSES } from "@/types/proposals"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type EditablePriceItem = PriceItemInput & { key: string }

type EditableProposal = Omit<ProposalPayload, "priceItems"> & {
  priceItems: EditablePriceItem[]
}

type ProposalWorkspaceProps = {
  initialProposals: ProposalRecord[]
  templates: ProposalTemplate[]
}

function proposalRecordToEditable(record: ProposalRecord): EditableProposal {
  return {
    id: record.id,
    dealId: record.dealId,
    title: record.title,
    scopeMd: record.scopeMd,
    timelineMd: record.timelineMd,
    status: record.status,
    priceItems: record.priceItems.map((item) => ({
      ...item,
      key: item.id,
    })),
  }
}

function templateToEditable(template: ProposalTemplate): EditableProposal {
  return {
    id: undefined,
    dealId: null,
    title: template.title,
    scopeMd: template.scopeMd,
    timelineMd: template.timelineMd,
    status: "DRAFT",
    priceItems: template.priceItems.map((item) => ({
      ...item,
      key: crypto.randomUUID(),
    })),
  }
}

function createEmptyProposal(): EditableProposal {
  return {
    id: undefined,
    dealId: null,
    title: "",
    scopeMd: "## Rozsah\n",
    timelineMd: "## Harmonogram\n",
    status: "DRAFT",
    priceItems: [
      { key: crypto.randomUUID(), label: "", qty: 1, unitPriceCZK: 0, vatRate: DEFAULT_VAT_RATE },
    ],
  }
}

function editableToPayload(editable: EditableProposal): ProposalPayload {
  return {
    id: editable.id,
    dealId: editable.dealId ?? null,
    title: editable.title,
    scopeMd: editable.scopeMd,
    timelineMd: editable.timelineMd,
    status: editable.status,
    priceItems: editable.priceItems.map((item) => ({
      label: item.label,
      qty: item.qty,
      unitPriceCZK: item.unitPriceCZK,
      vatRate: item.vatRate,
    })),
  }
}

function PriceItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: EditablePriceItem
  onChange: (value: EditablePriceItem) => void
  onRemove: () => void
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2">
      <Input
        value={item.label}
        placeholder="Název položky"
        onChange={(event) => onChange({ ...item, label: event.target.value })}
      />
      <Input
        value={item.qty}
        type="number"
        min={1}
        className="w-20"
        onChange={(event) =>
          onChange({ ...item, qty: Number.parseInt(event.target.value || "0", 10) })
        }
      />
      <Input
        value={item.unitPriceCZK}
        type="number"
        min={0}
        className="w-28"
        onChange={(event) =>
          onChange({ ...item, unitPriceCZK: Number.parseInt(event.target.value || "0", 10) })
        }
      />
      <Input
        value={item.vatRate}
        type="number"
        min={0}
        max={1}
        step="0.01"
        className="w-24"
        onChange={(event) =>
          onChange({ ...item, vatRate: Number.parseFloat(event.target.value || "0") })
        }
      />
      <Button variant="outline" size="sm" onClick={onRemove}>
        Odebrat
      </Button>
    </div>
  )
}

export function ProposalWorkspace({
  initialProposals,
  templates,
}: ProposalWorkspaceProps) {
  const router = useRouter()
  const [proposals, setProposals] = useState(initialProposals)
  const [activeId, setActiveId] = useState<string | null>(
    initialProposals.length ? initialProposals[0]!.id : null,
  )
  const [editable, setEditable] = useState<EditableProposal>(() => {
    if (initialProposals.length) {
      return proposalRecordToEditable(initialProposals[0]!)
    }
    return createEmptyProposal()
  })
  const [warnings, setWarnings] = useState<string[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const totals = useMemo(() => calculateProposalTotals(editable.priceItems), [editable.priceItems])

  const activeRecord = proposals.find((proposal) => proposal.id === activeId) ?? null
  const shareUrl = activeRecord ? `/p/${activeRecord.shareToken}` : null

  function setPriceItems(items: EditablePriceItem[]) {
    setEditable((prev) => ({
      ...prev,
      priceItems: items,
    }))
  }

  function handleSelectProposal(record: ProposalRecord) {
    setActiveId(record.id)
    setEditable(proposalRecordToEditable(record))
    setWarnings([])
    setMessage(null)
  }

  function handleSelectTemplate(template: ProposalTemplate) {
    setActiveId(null)
    setEditable(templateToEditable(template))
    setWarnings([])
    setMessage(null)
  }

  function handleAddItem() {
    setPriceItems([
      ...editable.priceItems,
      { key: crypto.randomUUID(), label: "", qty: 1, unitPriceCZK: 0, vatRate: DEFAULT_VAT_RATE },
    ])
  }

  function handleSave() {
    startTransition(async () => {
      setMessage(null)
      try {
        const payload = editableToPayload(editable)
        const response = await upsertProposalAction(payload)
        setWarnings(response.warnings)

        setProposals((current) => {
          const existingIndex = current.findIndex((item) => item.id === response.proposal.id)
          if (existingIndex >= 0) {
            const next = [...current]
            next[existingIndex] = response.proposal
            return next
          }
          return [response.proposal, ...current]
        })

        setEditable(proposalRecordToEditable(response.proposal))
        setActiveId(response.proposal.id)
        setMessage("Nabídka uložena.")
        router.refresh()
      } catch (error) {
        console.error(error)
        setMessage("Uložení selhalo. Zkuste to prosím znovu.")
      }
    })
  }

  const markdownPreview = useMemo(() => {
    return {
      scope: markdownToHtml(editable.scopeMd),
      timeline: markdownToHtml(editable.timelineMd),
    }
  }, [editable.scopeMd, editable.timelineMd])

  const marginWarning = totals.marginRatio < DEAL_DESK_MARGIN_THRESHOLD

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Nabídky</CardTitle>
          <CardDescription>Vyberte existující nabídku nebo založte novou ze šablony.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {proposals.map((proposal) => (
              <button
                key={proposal.id}
                type="button"
                onClick={() => handleSelectProposal(proposal)}
                className="border-border hover:bg-muted data-[active=true]:border-primary data-[active=true]:bg-primary/10 flex flex-col gap-1 rounded-lg border px-4 py-3 text-left transition"
                data-active={proposal.id === activeId}
              >
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{proposal.title}</span>
                  <Badge variant={proposal.id === activeId ? "default" : "secondary"}>{proposal.status}</Badge>
                </div>
                <div className="text-muted-foreground text-xs">
                  {formatCurrencyCZK(proposal.totalCZK)} • Aktualizováno {new Date(proposal.updatedAt).toLocaleDateString("cs-CZ")}
                </div>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-xs font-medium uppercase text-muted-foreground">Šablony</div>
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleSelectTemplate(template)}
                className="border-dashed border border-border hover:bg-muted rounded-lg px-4 py-3 text-left transition"
              >
                <div className="font-medium">{template.title}</div>
                {template.description ? (
                  <div className="text-muted-foreground text-sm">{template.description}</div>
                ) : null}
              </button>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                setActiveId(null)
                setEditable(createEmptyProposal())
                setWarnings([])
                setMessage(null)
              }}
            >
              Nová prázdná nabídka
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Editor nabídky</CardTitle>
            <CardDescription>Upravte obsah, položky a exportujte jako PDF.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => handleAddItem()} size="sm">
              Přidat položku
            </Button>
            {editable.id ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/api/proposals/${editable.id}/pdf`, "_blank")}
              >
                Export PDF
              </Button>
            ) : null}
            {shareUrl ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(`${window.location.origin}${shareUrl}`)
                  setMessage("Odkaz zkopírován do schránky.")
                }}
              >
                Kopírovat odkaz
              </Button>
            ) : null}
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Ukládání..." : "Uložit nabídku"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Název</label>
              <Input
                value={editable.title}
                onChange={(event) => setEditable({ ...editable, title: event.target.value })}
                placeholder="Název nabídky"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Deal ID</label>
              <Input
                value={editable.dealId ?? ""}
                onChange={(event) =>
                  setEditable({ ...editable, dealId: event.target.value ? event.target.value : null })
                }
                placeholder="Volitelné propojení na deal"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={editable.status}
                onValueChange={(value) => setEditable({ ...editable, status: value as typeof editable.status })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Vyberte status" />
                </SelectTrigger>
                <SelectContent>
                  {PROPOSAL_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Rozsah (Markdown)</label>
            <Textarea
              value={editable.scopeMd}
              onChange={(event) => setEditable({ ...editable, scopeMd: event.target.value })}
              className="min-h-[160px]"
            />
            <div className="border-border bg-muted/40 rounded-lg border p-4">
              <div className="text-xs font-medium uppercase text-muted-foreground">Náhled</div>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: markdownPreview.scope }}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Harmonogram (Markdown)</label>
            <Textarea
              value={editable.timelineMd}
              onChange={(event) => setEditable({ ...editable, timelineMd: event.target.value })}
              className="min-h-[160px]"
            />
            <div className="border-border bg-muted/40 rounded-lg border p-4">
              <div className="text-xs font-medium uppercase text-muted-foreground">Náhled</div>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: markdownPreview.timeline }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="text-sm font-medium">Položky</div>
            <div className="flex flex-col gap-3">
              {editable.priceItems.map((item) => (
                <PriceItemRow
                  key={item.key}
                  item={item}
                  onChange={(value) =>
                    setPriceItems(
                      editable.priceItems.map((current) =>
                        current.key === item.key ? { ...value } : current,
                      ),
                    )
                  }
                  onRemove={() =>
                    setPriceItems(editable.priceItems.filter((current) => current.key !== item.key))
                  }
                />
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium">Souhrn</div>
            <div className="border-border bg-muted/40 grid grid-cols-1 gap-2 rounded-lg border p-4 sm:grid-cols-2">
              <div>
                <div className="text-xs text-muted-foreground">Bez DPH</div>
                <div className="text-base font-semibold">{formatCurrencyCZK(totals.subtotalCZK)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">DPH</div>
                <div className="text-base font-semibold">{formatCurrencyCZK(totals.vatCZK)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Celkem</div>
                <div className="text-base font-semibold">{formatCurrencyCZK(totals.totalCZK)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Marže</div>
                <div className="text-base font-semibold">{formatPercent(totals.marginRatio)}</div>
              </div>
            </div>
            {marginWarning ? (
              <div className="text-destructive text-sm">
                Marže je pod limitem {formatPercent(DEAL_DESK_MARGIN_THRESHOLD)}. Zvažte úpravu ceny.
              </div>
            ) : null}
            {warnings.map((warning) => (
              <div key={warning} className="text-amber-600 text-sm">
                {warning}
              </div>
            ))}
            {message ? <div className="text-sm text-muted-foreground">{message}</div> : null}
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          {shareUrl ? (
            <div className="text-xs text-muted-foreground">
              Veřejný odkaz: <span className="font-medium">{shareUrl}</span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Uložte návrh pro sdílení.</div>
          )}
          <div className="text-xs text-muted-foreground">
            Aktualizace: {activeRecord ? new Date(activeRecord.updatedAt).toLocaleString("cs-CZ") : "—"}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
