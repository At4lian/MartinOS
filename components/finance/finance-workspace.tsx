"use client"

import {
  type ChangeEvent,
  type FormEvent,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import { toast } from "sonner"
import { Bar, BarChart, CartesianGrid, Line, XAxis, YAxis } from "recharts"

import {
  createFinanceRecordAction,
  exportFinanceRecordsAction,
  importFinanceRecordsAction,
} from "@/actions/finance"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrencyCZK, formatPercent } from "@/lib/format"
import type {
  FinanceDashboardData,
  FinanceDealMargin,
  FinanceDealSummary,
  FinanceMonthlySummary,
  FinanceRecordItem,
  FinanceRecordType,
} from "@/types/finance"

interface FinanceWorkspaceProps {
  initialData: FinanceDashboardData
}

type RecordDraft = {
  date: string
  type: FinanceRecordType
  label: string
  amount: string
  dealId: string
}

const TYPE_LABEL: Record<FinanceRecordType, string> = {
  income: "Příjem",
  expense: "Náklad",
}

const chartConfig = {
  income: {
    label: "Příjmy",
    color: "var(--chart-1)",
  },
  expense: {
    label: "Náklady",
    color: "var(--chart-2)",
  },
  profit: {
    label: "Zisk",
    color: "var(--chart-3)",
  },
} as const

function createDefaultDraft(): RecordDraft {
  return {
    date: new Date().toISOString().slice(0, 10),
    type: "income",
    label: "",
    amount: "",
    dealId: "",
  }
}

function formatMonthLabel(month: string) {
  const formatter = new Intl.DateTimeFormat("cs-CZ", {
    month: "short",
    year: "numeric",
  })
  const date = new Date(`${month}-01T00:00:00Z`)
  return formatter.format(date)
}

function formatAxisCurrency(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    return `${Math.round(value / 1_000_000)}m`
  }
  if (Math.abs(value) >= 1_000) {
    return `${Math.round(value / 1_000)}k`
  }
  return value.toString()
}

export function FinanceWorkspace({ initialData }: FinanceWorkspaceProps) {
  const [records, setRecords] = useState<FinanceRecordItem[]>(initialData.records)
  const [monthlySummaries, setMonthlySummaries] = useState<FinanceMonthlySummary[]>(
    initialData.monthlySummaries,
  )
  const [dealMargins, setDealMargins] = useState<FinanceDealMargin[]>(initialData.dealMargins)
  const [totals, setTotals] = useState(initialData.totals)
  const [deals, setDeals] = useState<FinanceDealSummary[]>(initialData.deals)
  const [draft, setDraft] = useState<RecordDraft>(() => createDefaultDraft())
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const chartData = useMemo(
    () =>
      monthlySummaries.map((summary) => ({
        month: summary.month,
        monthLabel: formatMonthLabel(summary.month),
        income: summary.income,
        expense: summary.expense,
        profit: summary.profit,
      })),
    [monthlySummaries],
  )

  const dealOptions = useMemo(
    () =>
      deals
        .map((deal) => ({
          id: deal.id,
          label: deal.leadCompany ? `${deal.leadCompany} (${formatCurrencyCZK(deal.valueCZK)})` : `Deal ${deal.id.slice(0, 6)}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "cs")),
    [deals],
  )

  function applyDashboardUpdate(data: FinanceDashboardData) {
    setRecords(data.records)
    setMonthlySummaries(data.monthlySummaries)
    setDealMargins(data.dealMargins)
    setTotals(data.totals)
    setDeals(data.deals)
  }

  function resetDraft() {
    setDraft(createDefaultDraft())
  }

  function handleDraftChange<Key extends keyof RecordDraft>(key: Key, value: RecordDraft[Key]) {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedLabel = draft.label.trim()
    if (!trimmedLabel) {
      toast.error("Prosím vyplňte popis záznamu")
      return
    }

    const amountValue = Math.round(Number(draft.amount))
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error("Částka musí být kladné číslo")
      return
    }

    startTransition(async () => {
      try {
        const data = await createFinanceRecordAction({
          date: draft.date,
          type: draft.type,
          label: trimmedLabel,
          amountCZK: amountValue,
          dealId: draft.dealId ? draft.dealId : null,
        })
        applyDashboardUpdate(data)
        toast.success("Finanční záznam byl přidán")
        resetDraft()
      } catch (error) {
        console.error(error)
        toast.error("Nepodařilo se uložit finanční záznam")
      }
    })
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    startTransition(async () => {
      try {
        const data = await importFinanceRecordsAction(formData)
        applyDashboardUpdate(data)
        toast.success("CSV import proběhl úspěšně")
      } catch (error) {
        console.error(error)
        toast.error((error as Error).message || "Import CSV se nezdařil")
      } finally {
        event.target.value = ""
      }
    })
  }

  function handleExport() {
    startTransition(async () => {
      try {
        const csv = await exportFinanceRecordsAction()
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `finance-records-${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success("CSV export vytvořen")
      } catch (error) {
        console.error(error)
        toast.error("Export CSV selhal")
      }
    })
  }

  const hasRecords = records.length > 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Finance</h2>
          <p className="text-sm text-muted-foreground">
            Sledujte cashflow z dealů, plánujte náklady a hlídejte měsíční run-rate.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button variant="outline" onClick={handleImportClick} disabled={isPending}>
            Import CSV
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={isPending || !hasRecords}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Celkové příjmy</CardTitle>
            <CardDescription>Součet všech zaevidovaných příjmů</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrencyCZK(totals.income)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Celkové náklady</CardTitle>
            <CardDescription>Suma všech výdajů</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-destructive">
            -{formatCurrencyCZK(totals.expense)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Zisk</CardTitle>
            <CardDescription>Rozdíl příjmů a nákladů</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrencyCZK(totals.profit)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Měsíční run-rate</CardTitle>
            <CardDescription>Průměrný měsíční zisk</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrencyCZK(totals.monthlyRunRate)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-1">
          <CardTitle>Cashflow</CardTitle>
          <CardDescription>Vývoj příjmů, nákladů a zisku podle měsíců</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length ? (
            <ChartContainer config={chartConfig} className="h-[320px]">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="monthLabel" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={formatAxisCurrency} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        formatCurrencyCZK(value as number),
                        chartConfig[name as keyof typeof chartConfig]?.label ?? name,
                      ]}
                    />
                  }
                />
                <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="var(--color-profit)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground">
              Přidejte první záznam, abyste viděli graf cashflow.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Finanční záznamy</CardTitle>
            <CardDescription>Evidence příjmů a nákladů</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="grid gap-4 md:grid-cols-5" onSubmit={handleSubmit}>
              <div className="md:col-span-1">
                <Label htmlFor="finance-date">Datum</Label>
                <Input
                  id="finance-date"
                  type="date"
                  value={draft.date}
                  onChange={(event) => handleDraftChange("date", event.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="finance-type">Typ</Label>
                <Select
                  value={draft.type}
                  onValueChange={(value: FinanceRecordType) => handleDraftChange("type", value)}
                  disabled={isPending}
                >
                  <SelectTrigger id="finance-type">
                    <SelectValue placeholder="Vyberte typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Příjem</SelectItem>
                    <SelectItem value="expense">Náklad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="finance-amount">Částka (CZK)</Label>
                <Input
                  id="finance-amount"
                  type="number"
                  min={1}
                  step={100}
                  value={draft.amount}
                  onChange={(event) => handleDraftChange("amount", event.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="finance-label">Popis</Label>
                <Input
                  id="finance-label"
                  placeholder="Např. Platba za projekt Alfa"
                  value={draft.label}
                  onChange={(event) => handleDraftChange("label", event.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="finance-deal">Deal</Label>
                <Select
                  value={draft.dealId}
                  onValueChange={(value) => handleDraftChange("dealId", value)}
                  disabled={isPending}
                >
                  <SelectTrigger id="finance-deal">
                    <SelectValue placeholder="Nepřiřazeno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nepřiřazeno</SelectItem>
                    {dealOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-1 flex items-end">
                <Button type="submit" className="w-full" disabled={isPending}>
                  Přidat
                </Button>
              </div>
            </form>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Popis</TableHead>
                    <TableHead>Částka</TableHead>
                    <TableHead>Deal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hasRecords ? (
                    records.map((record) => {
                      const formattedAmount =
                        record.type === "income"
                          ? formatCurrencyCZK(record.amountCZK)
                          : `-${formatCurrencyCZK(record.amountCZK)}`
                      const dateLabel = new Date(record.date).toLocaleDateString("cs-CZ")
                      const dealLabel = record.dealLeadCompany ?? record.dealStatus ?? "—"
                      return (
                        <TableRow key={record.id}>
                          <TableCell>{dateLabel}</TableCell>
                          <TableCell>
                            <Badge variant={record.type === "income" ? "default" : "secondary"}>
                              {TYPE_LABEL[record.type]}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[260px] truncate" title={record.label}>
                            {record.label}
                          </TableCell>
                          <TableCell
                            className={record.type === "income" ? "text-emerald-600" : "text-destructive"}
                          >
                            {formattedAmount}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={dealLabel}>
                            {record.dealId ? dealLabel : "Nepřiřazeno"}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        Zatím nejsou k dispozici žádné finanční záznamy.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <TableCaption>
              CSV sloupce: <code>date,type,label,amountCZK,dealId</code>
            </TableCaption>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marže podle dealů</CardTitle>
            <CardDescription>Srovnání příjmů a nákladů na jednotlivé dealy</CardDescription>
          </CardHeader>
          <CardContent>
            {dealMargins.length ? (
              <div className="space-y-4">
                {dealMargins.map((deal) => {
                  const margin =
                    deal.marginRatio === null ? "—" : formatPercent(deal.marginRatio)
                  return (
                    <div key={deal.dealId} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            {deal.leadCompany ?? `Deal ${deal.dealId.slice(0, 6)}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {deal.status}
                          </p>
                        </div>
                        <Badge variant="outline">{margin}</Badge>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <dt className="text-muted-foreground">Příjmy</dt>
                          <dd>{formatCurrencyCZK(deal.income)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Náklady</dt>
                          <dd>-{formatCurrencyCZK(deal.expense)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Zisk</dt>
                          <dd>{formatCurrencyCZK(deal.profit)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Hodnota dealu</dt>
                          <dd>{formatCurrencyCZK(deal.valueCZK)}</dd>
                        </div>
                      </dl>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Zatím nemáme žádné finanční vazby na dealy. Přiřaďte záznamy k dealům a uvidíte marži.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
