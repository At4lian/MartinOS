import type { CSSProperties } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { Blacklist } from "@/components/focus/Blacklist"
import { DeepWorkTimer } from "@/components/focus/DeepWorkTimer"
import { TimeboxList } from "@/components/focus/TimeboxList"
import { SiteHeader } from "@/components/site-header"
import { Toaster } from "@/components/ui/sonner"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { getTimeboxes } from "@/actions/timebox"

export default async function FocusPage() {
  const timeboxes = await getTimeboxes()

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
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <TimeboxList timeboxes={timeboxes} />
              <div className="flex flex-col gap-6">
                <DeepWorkTimer />
                <Blacklist />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      <Toaster richColors />
    </SidebarProvider>
  )
}
