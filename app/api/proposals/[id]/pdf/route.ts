import { NextResponse } from "next/server"

import { db } from "@/lib/prisma"
import { formatCurrencyCZK } from "@/lib/format"
import { createSimplePdf } from "@/lib/simple-pdf"
import { serializeProposal } from "@/lib/proposals"

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/`{1,3}[^`]+`/g, (match) => match.replace(/`/g, ""))
    .replace(/[*_~]/g, "")
    .replace(/#{1,6}\s*/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export async function GET(
  _: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const proposal = await db.proposal.findUnique({
    where: { id: params.id },
    include: {
      priceItems: true,
      deal: true,
    },
  })

  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const record = serializeProposal(proposal)
  const priceLines = record.priceItems.map((item) => {
    const base = item.qty * item.unitPriceCZK
    return `${item.qty}× ${item.label} – ${formatCurrencyCZK(base)} bez DPH`
  })

  const lines = [
    `Stav: ${record.status}`,
    `Celkem s DPH: ${formatCurrencyCZK(record.totalCZK)}`,
    `Základ daně: ${formatCurrencyCZK(record.subtotalCZK)}`,
    `DPH: ${formatCurrencyCZK(record.vatCZK)}`,
    "",
    "Položky:",
    ...priceLines,
    "",
    "Rozsah:",
    ...stripMarkdown(record.scopeMd),
    "",
    "Harmonogram:",
    ...stripMarkdown(record.timelineMd),
  ]

  const pdf = createSimplePdf({
    title: record.title,
    lines,
  })

  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="proposal-${record.id}.pdf"`,
  })

  return new NextResponse(pdf, { headers })
}
