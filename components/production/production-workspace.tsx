"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  PRODUCTION_STATUSES,
  type Asset,
  type ChecklistItem,
  type ProductionStatus,
  type Project,
  type ProjectTemplate,
} from "@/types/production"

import { KanbanBoard } from "./kanban-board"
import { ProjectDetails } from "./project-details"

interface ProductionWorkspaceProps {
  initialProjects: Project[]
  initialAssets: Asset[]
  initialChecklist: ChecklistItem[]
  templates: ProjectTemplate[]
}

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "svg"]
const VIDEO_EXTENSIONS = ["mp4", "mov", "m4v", "webm"]

function detectAssetKind(url: string): Asset["kind"] {
  try {
    const parsed = new URL(url)
    const extension = parsed.pathname.split(".").pop()?.toLowerCase()
    if (!extension) return "other"
    if (IMAGE_EXTENSIONS.includes(extension)) return "image"
    if (VIDEO_EXTENSIONS.includes(extension)) return "video"
    return "other"
  } catch (error) {
    console.warn("Unable to parse asset URL", error)
    return "other"
  }
}

export function ProductionWorkspace({
  initialProjects,
  initialAssets,
  initialChecklist,
  templates,
}: ProductionWorkspaceProps) {
  const defaultTemplateId = templates[0]?.id ?? ""
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    initialProjects[0]?.id ?? null,
  )
  const [clientFilter, setClientFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<ProductionStatus | "ALL">("ALL")

  const [templateId, setTemplateId] = useState<string>(defaultTemplateId)
  const [newTitle, setNewTitle] = useState<string>("")
  const [newClient, setNewClient] = useState<string>("")
  const [newDueDate, setNewDueDate] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  const clients = useMemo(() => {
    const unique = new Set(projects.map((project) => project.client))
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "cs"))
  }, [projects])

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (clientFilter !== "ALL" && project.client !== clientFilter) {
        return false
      }
      if (statusFilter !== "ALL" && project.status !== statusFilter) {
        return false
      }
      return true
    })
  }, [projects, clientFilter, statusFilter])

  const activeProjectId = useMemo(() => {
    if (selectedProjectId && filteredProjects.some((project) => project.id === selectedProjectId)) {
      return selectedProjectId
    }
    return filteredProjects[0]?.id ?? null
  }, [filteredProjects, selectedProjectId])

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  )

  const selectedChecklist = useMemo(
    () =>
      checklist
        .filter((item) => item.projectId === activeProjectId)
        .sort((a, b) => a.title.localeCompare(b.title, "cs")),
    [checklist, activeProjectId],
  )

  const selectedAssets = useMemo(
    () => assets.filter((asset) => asset.projectId === activeProjectId),
    [assets, activeProjectId],
  )

  function handleStatusChange(projectId: string, status: ProductionStatus) {
    setProjects((prev) => prev.map((project) => (project.id === projectId ? { ...project, status } : project)))
  }

  function handleToggleChecklist(itemId: string, done: boolean) {
    setChecklist((prev) => prev.map((item) => (item.id === itemId ? { ...item, done } : item)))
  }

  function handleAddAsset(projectId: string, input: { url: string; note?: string }) {
    const kind = detectAssetKind(input.url)
    const nextVersion =
      assets
        .filter((asset) => asset.projectId === projectId)
        .reduce((acc, asset) => Math.max(acc, asset.version), 0) + 1

    const asset: Asset = {
      id: crypto.randomUUID(),
      projectId,
      kind,
      url: input.url,
      note: input.note?.trim() ? input.note.trim() : null,
      version: nextVersion,
    }

    setAssets((prev) => [asset, ...prev])
    toast.success("Asset byl přidán do projektu")
  }

  function handleCreateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const template = templates.find((item) => item.id === templateId)
    if (!template) {
      toast.error("Vyberte šablonu projektu")
      return
    }

    const trimmedTitle = newTitle.trim()
    const trimmedClient = newClient.trim()
    if (!trimmedTitle || !trimmedClient || !newDueDate) {
      toast.error("Vyplňte prosím název, klienta a datum")
      return
    }

    startTransition(() => {
      const projectId = crypto.randomUUID()
      const project: Project = {
        id: projectId,
        title: trimmedTitle,
        client: trimmedClient,
        status: "TODO",
        dueDate: newDueDate,
      }

      const newChecklistItems: ChecklistItem[] = template.checklist.map((title) => ({
        id: crypto.randomUUID(),
        projectId,
        title,
        done: false,
      }))

      setProjects((prev) => [project, ...prev])
      setChecklist((prev) => [...newChecklistItems, ...prev])

      setSelectedProjectId(projectId)
      setNewTitle("")
      setNewClient("")
      setNewDueDate("")
      toast.success("Projekt vytvořen ze šablony")
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Produkční deska</h2>
          <p className="text-sm text-muted-foreground">
            Organizujte projekty videa a animace, sledujte checklisty a sdílejte assety.
          </p>
        </div>
        <Badge variant="outline">{projects.length} projektů</Badge>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 md:p-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Nový projekt ze šablony
            </h3>
            <p className="text-sm text-muted-foreground/80">
              Vyberte šablonu (brief, storyboard nebo shotlist) a připravte projekt s předvyplněným checklistem.
            </p>
          </div>
          <form onSubmit={handleCreateProject} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="template">Šablona</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Vyberte šablonu" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="title">Název projektu</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Např. Brand teaser 2025"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="client">Klient</Label>
              <Input
                id="client"
                value={newClient}
                onChange={(event) => setNewClient(event.target.value)}
                placeholder="Název klienta"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="due-date">Deadline</Label>
              <Input
                id="due-date"
                type="date"
                value={newDueDate}
                onChange={(event) => setNewDueDate(event.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              <Button type="submit" disabled={isPending} className="w-full md:w-auto">
                {isPending ? "Zakládám projekt..." : "Vytvořit projekt"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap gap-4 p-4 md:p-6">
          <div className="min-w-[200px] space-y-1">
            <Label htmlFor="filter-client">Klient</Label>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger id="filter-client">
                <SelectValue placeholder="Všichni klienti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Všichni klienti</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client} value={client}>
                    {client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[200px] space-y-1">
            <Label htmlFor="filter-status">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as ProductionStatus | "ALL")}
            >
              <SelectTrigger id="filter-status">
                <SelectValue placeholder="Všechny statusy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Všechny statusy</SelectItem>
                {PRODUCTION_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <KanbanBoard
          projects={filteredProjects}
          onStatusChange={handleStatusChange}
          selectedProjectId={activeProjectId}
          onSelectProject={setSelectedProjectId}
        />
        <ProjectDetails
          project={selectedProject}
          assets={selectedAssets}
          checklist={selectedChecklist}
          onToggleChecklist={handleToggleChecklist}
          onAddAsset={handleAddAsset}
        />
      </div>
    </div>
  )
}
