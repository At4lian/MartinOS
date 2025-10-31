import type { CSSProperties } from "react"

import { getFinanceDashboard } from "@/actions/finance"
import { AppSidebar } from "@/components/app-sidebar"
import { FinanceWorkspace } from "@/components/finance/finance-workspace"
import { SiteHeader } from "@/components/site-header"
import { Toaster } from "@/components/ui/sonner"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export const dynamic = "force-dynamic"

export default async function FinancePage() {
  const data = await getFinanceDashboard()

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
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            <FinanceWorkspace initialData={data} />
          </div>
        </div>
      </SidebarInset>
      <Toaster richColors />
    </SidebarProvider>
  )
}
