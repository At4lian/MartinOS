import type { CSSProperties } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { ProductionWorkspace } from "@/components/production/production-workspace"
import { SiteHeader } from "@/components/site-header"
import { Toaster } from "@/components/ui/sonner"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  PRODUCTION_ASSETS,
  PRODUCTION_CHECKLISTS,
  PRODUCTION_PROJECTS,
  PRODUCTION_TEMPLATES,
} from "@/lib/production-data"

export default function ProductionPage() {
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
            <ProductionWorkspace
              initialProjects={PRODUCTION_PROJECTS}
              initialAssets={PRODUCTION_ASSETS}
              initialChecklist={PRODUCTION_CHECKLISTS}
              templates={PRODUCTION_TEMPLATES}
            />
          </div>
        </div>
      </SidebarInset>
      <Toaster richColors />
    </SidebarProvider>
  )
}
