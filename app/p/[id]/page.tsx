import { notFound } from "next/navigation"

import { formatCurrencyCZK, formatPercent } from "@/lib/format"
import { markdownToHtml } from "@/lib/markdown"
import { db } from "@/lib/prisma"
import { serializeProposal } from "@/lib/proposals"

export const dynamic = "force-dynamic"

export default async function ProposalSharePage({
  params,
}: {
  params: { id: string }
}) {
  const proposal = await db.proposal.findUnique({
    where: { shareToken: params.id },
    include: {
      priceItems: true,
      deal: true,
    },
  })

  if (!proposal) {
    notFound()
  }

  const record = serializeProposal(proposal)
  const scopeHtml = markdownToHtml(record.scopeMd)
  const timelineHtml = markdownToHtml(record.timelineMd)

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Veřejná nabídka</span>
          <h1 className="text-3xl font-semibold">{record.title}</h1>
          <div className="text-muted-foreground text-sm">
            Stav: <span className="font-medium text-foreground">{record.status}</span>
          </div>
        </header>
        <section className="grid gap-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="grid gap-2">
            <div className="text-sm font-medium text-muted-foreground">Souhrn ceny</div>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <div className="text-xs uppercase text-muted-foreground">Bez DPH</div>
                <div className="text-lg font-semibold">{formatCurrencyCZK(record.subtotalCZK)}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">DPH</div>
                <div className="text-lg font-semibold">{formatCurrencyCZK(record.vatCZK)}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">Celkem</div>
                <div className="text-lg font-semibold">{formatCurrencyCZK(record.totalCZK)}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">Marže</div>
                <div className="text-lg font-semibold">{formatPercent(record.marginRatio)}</div>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Položka</th>
                  <th className="px-4 py-3 font-medium">Množství</th>
                  <th className="px-4 py-3 font-medium">Jednotková cena (bez DPH)</th>
                  <th className="px-4 py-3 font-medium">DPH</th>
                  <th className="px-4 py-3 font-medium">Mezisoučet</th>
                </tr>
              </thead>
              <tbody>
                {record.priceItems.map((item) => {
                  const base = item.qty * item.unitPriceCZK
                  const vat = Math.round(base * item.vatRate)
                  return (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-3">{item.label}</td>
                      <td className="px-4 py-3">{item.qty}</td>
                      <td className="px-4 py-3">{formatCurrencyCZK(item.unitPriceCZK)}</td>
                      <td className="px-4 py-3">{formatPercent(item.vatRate)}</td>
                      <td className="px-4 py-3">{formatCurrencyCZK(base + vat)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
        <section className="grid gap-6 md:grid-cols-2">
          <article className="grid gap-3 rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Rozsah</h2>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: scopeHtml }} />
          </article>
          <article className="grid gap-3 rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Harmonogram</h2>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: timelineHtml }} />
          </article>
        </section>
      </div>
    </main>
  )
}
