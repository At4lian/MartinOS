import type { CSSProperties } from "react"

import { FamilyDashboard } from "./family-dashboard"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { prisma } from "@/lib/prisma"

export default async function FamilyPage() {
  const [ideas, trips] = await Promise.all([
    prisma.tripIdea.findMany({
      orderBy: { title: "asc" },
    }),
    prisma.trip.findMany({
      orderBy: { date: "asc" },
      include: {
        idea: true,
        budgetItems: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
  ])

  const ideaData = ideas.map((idea) => ({
    id: idea.id,
    title: idea.title,
    region: idea.region,
    durationH: idea.durationH,
    costCZK: idea.costCZK,
    tags: idea.tags,
  }))

  const tripData = trips.map((trip) => ({
    id: trip.id,
    title: trip.title,
    ideaId: trip.ideaId,
    date: trip.date.toISOString(),
    notes: trip.notes,
    budgetLimitCZK: trip.budgetLimitCZK,
    completed: trip.completed,
    idea: trip.idea
      ? {
          id: trip.idea.id,
          title: trip.idea.title,
          region: trip.idea.region,
          durationH: trip.idea.durationH,
          costCZK: trip.idea.costCZK,
          tags: trip.idea.tags,
        }
      : null,
    budgetItems: trip.budgetItems.map((item) => ({
      id: item.id,
      label: item.label,
      amountCZK: item.amountCZK,
    })),
  }))

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
            <FamilyDashboard ideas={ideaData} trips={tripData} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
