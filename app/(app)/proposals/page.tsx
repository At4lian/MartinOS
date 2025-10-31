import type { CSSProperties } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { ProposalWorkspace } from "@/components/proposals/proposal-workspace"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { PROPOSAL_TEMPLATES } from "@/lib/proposal-templates"
import { db } from "@/lib/prisma"
import { serializeProposal } from "@/lib/proposals"

export default async function Page() {
  const proposals = await db.proposal.findMany({
    include: {
      priceItems: true,
      deal: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  const records = proposals.map(serializeProposal)

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4 py-6">
            <div className="px-4 lg:px-6">
              <ProposalWorkspace initialProposals={records} templates={PROPOSAL_TEMPLATES} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
