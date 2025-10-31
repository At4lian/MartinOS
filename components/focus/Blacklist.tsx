"use client"

import type { FormEvent } from "react"
import { useState } from "react"
import { IconAlertTriangle, IconExternalLink } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

const DEFAULT_DOMAINS = ["youtube.com", "twitter.com", "reddit.com"]

const createDomainId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

type Domain = {
  id: string
  value: string
}

export function Blacklist() {
  const [domains, setDomains] = useState<Domain[]>(() =>
    DEFAULT_DOMAINS.map((value) => ({ id: createDomainId(), value }))
  )
  const [draft, setDraft] = useState("")

  const addDomain = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.trim()) {
      return
    }
    setDomains((prev) => [...prev, { id: createDomainId(), value: draft.trim() }])
    setDraft("")
  }

  const removeDomain = (id: string) => {
    setDomains((prev) => prev.filter((domain) => domain.id !== id))
  }

  const handleOutboundClick = (url: string) => {
    toast.warning("This link is on your blacklist", {
      description: url,
    })
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Link Blacklist</CardTitle>
        <CardDescription>
          Keep distracting sites in view. We&apos;ll warn you before you wander off.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-2" onSubmit={addDomain}>
          <div className="grid gap-2">
            <Label htmlFor="blacklist-domain">Add domain</Label>
            <Input
              id="blacklist-domain"
              placeholder="example.com"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            Add to blacklist
          </Button>
        </form>
        <Separator />
        <div className="space-y-3">
          {domains.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t blacklisted any links yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {domains.map((domain) => (
                <li
                  key={domain.id}
                  className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 p-3"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <IconAlertTriangle className="size-4 text-amber-500" />
                    {domain.value}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDomain(domain.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Separator />
        <div className="space-y-2">
          <p className="text-xs uppercase text-muted-foreground">Try it</p>
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => handleOutboundClick("https://twitter.com")}
          >
            <IconExternalLink className="size-4" />
            Simulate blocked link
          </Button>
          <p className="text-xs text-muted-foreground">
            Integrate this handler with your routing layer to stop navigation when a
            URL matches the blacklist.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
