"use client"
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  PRODUCTION_STATUS_LABEL,
  type Asset,
  type ChecklistItem,
  type Project,
} from "@/types/production"

interface ProjectDetailsProps {
  project: Project | null
  assets: Asset[]
  checklist: ChecklistItem[]
  onToggleChecklist: (itemId: string, done: boolean) => void
  onAddAsset: (projectId: string, input: { url: string; note?: string }) => void
}

export function ProjectDetails({
  project,
  assets,
  checklist,
  onToggleChecklist,
  onAddAsset,
}: ProjectDetailsProps) {
  const [assetUrl, setAssetUrl] = useState("")
  const [assetNote, setAssetNote] = useState("")

  const sortedAssets = useMemo(
    () =>
      [...assets].sort((a, b) => {
        if (a.version === b.version) {
          return b.id.localeCompare(a.id)
        }
        return b.version - a.version
      }),
    [assets],
  )

  const formattedDueDate = useMemo(() => {
    if (!project) return null
    const dueDate = new Date(project.dueDate)
    if (Number.isNaN(dueDate.getTime())) {
      return project.dueDate
    }
    return new Intl.DateTimeFormat("cs-CZ", {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dueDate)
  }, [project])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!project || !assetUrl.trim()) return

    onAddAsset(project.id, { url: assetUrl.trim(), note: assetNote.trim() })
    setAssetUrl("")
    setAssetNote("")
  }

  if (!project) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Vyberte projekt</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Klikněte na projekt v kanbanu pro zobrazení detailů, checklistu a assetů.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div>
          <CardTitle className="text-xl font-semibold">{project.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{project.client}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{PRODUCTION_STATUS_LABEL[project.status]}</Badge>
          {formattedDueDate ? <span>Deadline: {formattedDueDate}</span> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Checklist
            </h3>
            <p className="text-sm text-muted-foreground/80">
              Sledujte plnění klíčových kroků produkce.
            </p>
          </div>
          <div className="space-y-2">
            {checklist.length ? (
              checklist.map((item) => (
                <label
                  key={item.id}
                  htmlFor={item.id}
                  className="flex items-start gap-3 rounded-md border border-transparent p-2 text-sm transition-colors hover:border-muted-foreground/20"
                >
                  <Checkbox
                    id={item.id}
                    checked={item.done}
                    onCheckedChange={(checked) => onToggleChecklist(item.id, Boolean(checked))}
                  />
                  <span className={`leading-tight ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {item.title}
                  </span>
                </label>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Žádné položky checklistu.</p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Assety
            </h3>
            <p className="text-sm text-muted-foreground/80">
              Sdílejte náhledy a verze materiálů pro rychlou kontrolu.
            </p>
          </div>
          <div className="space-y-3">
            {sortedAssets.length ? (
              sortedAssets.map((asset) => (
                <article
                  key={asset.id}
                  className="space-y-2 rounded-lg border bg-muted/40 p-3"
                >
                  <AssetPreview asset={asset} />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">v{asset.version}</Badge>
                    <span>{asset.kind === "other" ? "Externí odkaz" : asset.kind === "video" ? "Video" : "Obrázek"}</span>
                    <Link
                      href={asset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Otevřít asset
                    </Link>
                  </div>
                  {asset.note ? (
                    <p className="text-sm text-muted-foreground">{asset.note}</p>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Zatím žádné assety.</p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Přidat asset
            </h3>
            <p className="text-sm text-muted-foreground/80">
              Vložte odkaz na náhled nebo finální materiál. Pro videa použijte MP4/WEBM, pro obrázky JPG/PNG/SVG.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="asset-url">URL assetu</Label>
              <Input
                id="asset-url"
                value={assetUrl}
                onChange={(event) => setAssetUrl(event.target.value)}
                placeholder="https://..."
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="asset-note">Poznámka (volitelné)</Label>
              <Textarea
                id="asset-note"
                value={assetNote}
                onChange={(event) => setAssetNote(event.target.value)}
                placeholder="Shrnutí nebo důležitý kontext k assetu"
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full">
              Přidat asset
            </Button>
          </form>
        </section>
      </CardContent>
    </Card>
  )
}

function AssetPreview({ asset }: { asset: Asset }) {
  if (asset.kind === "image") {
    return (
      <img
        src={asset.url}
        alt={asset.note ?? asset.url}
        loading="lazy"
        className="aspect-video w-full rounded-md object-cover"
      />
    )
  }

  if (asset.kind === "video") {
    return (
      <video
        src={asset.url}
        controls
        preload="none"
        playsInline
        className="aspect-video w-full rounded-md bg-black"
      />
    )
  }

  return (
    <div className="flex items-center justify-between rounded-md bg-background p-3 text-sm text-muted-foreground">
      <span>Asset není podporován pro náhled.</span>
      <Link
        href={asset.url}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-foreground underline-offset-4 hover:underline"
      >
        Otevřít
      </Link>
    </div>
  )
}
