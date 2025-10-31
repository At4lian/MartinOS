"use server"

import { revalidatePath } from "next/cache"
import { FinanceRecordType as PrismaFinanceRecordType } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/prisma"
import type {
  FinanceDashboardData,
  FinanceDealMargin,
  FinanceRecordInput,
  FinanceRecordItem,
  FinanceTotals,
  FinanceMonthlySummary,
  FinanceDealSummary,
  FinanceRecordType as FinanceRecordKind,
} from "@/types/finance"

const recordInputSchema = z.object({
  date: z.coerce.date(),
  type: z.enum(["income", "expense"] as const),
  label: z.string().min(1),
  amountCZK: z.coerce.number().int().min(1),
  dealId: z.string().cuid().nullable().optional(),
})

function mapDbTypeToClient(type: PrismaFinanceRecordType): FinanceRecordKind {
  return type === PrismaFinanceRecordType.INCOME ? "income" : "expense"
}

function mapClientTypeToDb(type: FinanceRecordKind): PrismaFinanceRecordType {
  return type === "income"
    ? PrismaFinanceRecordType.INCOME
    : PrismaFinanceRecordType.EXPENSE
}

function escapeCsvValue(value: string): string {
  if (value.includes("\"") || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]

    if (char === "\"") {
      if (inQuotes && line[i + 1] === "\"") {
        current += "\""
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === "," && !inQuotes) {
      values.push(current)
      current = ""
      continue
    }

    current += char
  }

  values.push(current)
  return values.map((value) => value.trim())
}

async function fetchFinanceDashboardData(): Promise<FinanceDashboardData> {
  const [records, deals] = await Promise.all([
    db.financeRecord.findMany({
      include: {
        deal: {
          include: { lead: true },
        },
      },
      orderBy: { date: "desc" },
    }),
    db.deal.findMany({
      include: { lead: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const dealSummaries: FinanceDealSummary[] = deals.map((deal) => ({
    id: deal.id,
    leadCompany: deal.lead?.company ?? null,
    status: deal.status,
    valueCZK: deal.valueCZK,
  }))

  const dealMeta = new Map(dealSummaries.map((deal) => [deal.id, deal]))

  const serializedRecords: FinanceRecordItem[] = records.map((record) => ({
    id: record.id,
    date: record.date.toISOString(),
    type: mapDbTypeToClient(record.type),
    label: record.label,
    amountCZK: record.amountCZK,
    dealId: record.dealId,
    dealLeadCompany: record.deal?.lead?.company ?? null,
    dealStatus: record.deal?.status ?? null,
    dealValueCZK: record.deal?.valueCZK ?? null,
  }))

  const totals: FinanceTotals = serializedRecords.reduce(
    (acc, record) => {
      if (record.type === "income") {
        acc.income += record.amountCZK
      } else {
        acc.expense += record.amountCZK
      }
      return acc
    },
    { income: 0, expense: 0, profit: 0, monthlyRunRate: 0 },
  )
  totals.profit = totals.income - totals.expense

  const monthlyMap = new Map<string, { income: number; expense: number }>()
  serializedRecords.forEach((record) => {
    const monthKey = record.date.slice(0, 7)
    const entry = monthlyMap.get(monthKey) ?? { income: 0, expense: 0 }
    if (record.type === "income") {
      entry.income += record.amountCZK
    } else {
      entry.expense += record.amountCZK
    }
    monthlyMap.set(monthKey, entry)
  })

  const monthlySummaries: FinanceMonthlySummary[] = Array.from(monthlyMap.entries())
    .map(([month, summary]) => ({
      month,
      income: summary.income,
      expense: summary.expense,
      profit: summary.income - summary.expense,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  totals.monthlyRunRate =
    monthlySummaries.length > 0
      ? Math.round(
          monthlySummaries.reduce((acc, item) => acc + item.profit, 0) /
            monthlySummaries.length,
        )
      : 0

  const dealAggregation = new Map<
    string,
    { income: number; expense: number }
  >()

  serializedRecords.forEach((record) => {
    if (!record.dealId) return
    const entry = dealAggregation.get(record.dealId) ?? { income: 0, expense: 0 }
    if (record.type === "income") {
      entry.income += record.amountCZK
    } else {
      entry.expense += record.amountCZK
    }
    dealAggregation.set(record.dealId, entry)
  })

  const dealMargins: FinanceDealMargin[] = Array.from(dealAggregation.entries())
    .map(([dealId, summary]) => {
      const meta = dealMeta.get(dealId)
      const profit = summary.income - summary.expense
      return {
        dealId,
        leadCompany: meta?.leadCompany ?? null,
        status: meta?.status ?? "Unknown",
        valueCZK: meta?.valueCZK ?? 0,
        income: summary.income,
        expense: summary.expense,
        profit,
        marginRatio: summary.income > 0 ? profit / summary.income : null,
      }
    })
    .sort((a, b) => b.profit - a.profit)

  return {
    records: serializedRecords,
    totals,
    monthlySummaries,
    dealMargins,
    deals: dealSummaries,
  }
}

export async function getFinanceDashboard(): Promise<FinanceDashboardData> {
  return fetchFinanceDashboardData()
}

export async function createFinanceRecordAction(
  input: FinanceRecordInput,
): Promise<FinanceDashboardData> {
  const parsed = recordInputSchema.parse(input)

  await db.financeRecord.create({
    data: {
      date: parsed.date,
      type: mapClientTypeToDb(parsed.type),
      label: parsed.label,
      amountCZK: parsed.amountCZK,
      dealId: parsed.dealId ?? null,
    },
  })

  revalidatePath("/finance")
  return fetchFinanceDashboardData()
}

export async function importFinanceRecordsAction(
  formData: FormData,
): Promise<FinanceDashboardData> {
  const file = formData.get("file")
  if (!file || !(file instanceof File)) {
    throw new Error("CSV soubor je vyžadován")
  }

  const content = await file.text()
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (!lines.length) {
    throw new Error("CSV soubor neobsahuje žádná data")
  }

  let rows = lines
  const header = lines[0].toLowerCase()
  if (header.includes("date") && header.includes("type")) {
    rows = lines.slice(1)
  }

  const parsedRows = rows.map((line, index) => {
    const cells = parseCsvLine(line)
    if (cells.length < 4) {
      throw new Error(
        `Chybný řádek ${index + 1}: očekáván formát date,type,label,amountCZK,dealId`,
      )
    }
    const [date, type, label, amount, dealId] = cells
    try {
      return recordInputSchema.parse({
        date,
        type,
        label,
        amountCZK: amount,
        dealId: dealId ? dealId : null,
      })
    } catch (error) {
      throw new Error(`Chybný řádek ${index + 1}: ${(error as Error).message}`)
    }
  })

  if (!parsedRows.length) {
    throw new Error("CSV soubor neobsahuje žádné platné záznamy")
  }

  await db.financeRecord.createMany({
    data: parsedRows.map((row) => ({
      date: row.date,
      type: mapClientTypeToDb(row.type),
      label: row.label,
      amountCZK: row.amountCZK,
      dealId: row.dealId ?? null,
    })),
  })

  revalidatePath("/finance")
  return fetchFinanceDashboardData()
}

export async function exportFinanceRecordsAction(): Promise<string> {
  const records = await db.financeRecord.findMany({
    orderBy: { date: "asc" },
  })

  const header = "date,type,label,amountCZK,dealId"
  const lines = records.map((record) => {
    const values = [
      record.date.toISOString().slice(0, 10),
      mapDbTypeToClient(record.type),
      escapeCsvValue(record.label),
      record.amountCZK.toString(),
      record.dealId ?? "",
    ]
    return values.join(",")
  })

  return [header, ...lines].join("\n")
}
