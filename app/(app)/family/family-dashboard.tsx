"use client"

import { useMemo, useState, useTransition } from "react"

import { useRouter } from "next/navigation"

import { addBudgetItemAction, createTripAction, createTripIdeaAction, toggleTripCompletionAction } from "@/actions/family"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

type TripIdeaDTO = {
  id: string
  title: string
  region: string
  durationH: number
  costCZK: number
  tags: string[]
}

type BudgetItemDTO = {
  id: string
  label: string
  amountCZK: number
}

type TripDTO = {
  id: string
  title: string
  ideaId: string | null
  date: string
  notes: string | null
  budgetLimitCZK: number | null
  completed: boolean
  idea: TripIdeaDTO | null
  budgetItems: BudgetItemDTO[]
}

type DurationFilter = "all" | "half" | "full"

interface FamilyDashboardProps {
  ideas: TripIdeaDTO[]
  trips: TripDTO[]
}

const dateFormatter = new Intl.DateTimeFormat("cs-CZ", {
  dateStyle: "medium",
})

export function FamilyDashboard({ ideas, trips }: FamilyDashboardProps) {
  const router = useRouter()

  const [durationFilter, setDurationFilter] = useState<DurationFilter>("all")

  const [ideaForm, setIdeaForm] = useState({
    title: "",
    region: "",
    durationH: "4",
    costCZK: "0",
    tags: "",
  })
  const [ideaError, setIdeaError] = useState<string | null>(null)
  const [isIdeaPending, startIdeaTransition] = useTransition()

  const [tripForm, setTripForm] = useState({
    title: "",
    ideaId: "",
    date: "",
    notes: "",
    budgetLimit: "",
  })
  const [tripError, setTripError] = useState<string | null>(null)
  const [isTripPending, startTripTransition] = useTransition()

  const [budgetForms, setBudgetForms] = useState<Record<string, { label: string; amount: string }>>({})
  const [budgetErrors, setBudgetErrors] = useState<Record<string, string | null>>({})
  const [pendingBudgetTrip, setPendingBudgetTrip] = useState<string | null>(null)

  const filteredIdeas = useMemo(() => {
    if (durationFilter === "all") {
      return ideas
    }

    return ideas.filter((idea) => {
      if (durationFilter === "half") {
        return idea.durationH >= 2 && idea.durationH <= 4
      }
      return idea.durationH > 4
    })
  }, [ideas, durationFilter])

  const upcomingTrips = useMemo<Array<TripDTO & { isPast: boolean }>>(() => {
    const now = new Date()
    return trips
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((trip) => ({
        ...trip,
        isPast: new Date(trip.date) < new Date(now.toDateString()),
      }))
  }, [trips])

  function resetIdeaForm() {
    setIdeaForm({ title: "", region: "", durationH: "4", costCZK: "0", tags: "" })
  }

  function resetTripForm() {
    setTripForm({ title: "", ideaId: "", date: "", notes: "", budgetLimit: "" })
  }

  async function handleCreateIdea(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIdeaError(null)

    const tags = ideaForm.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    const durationH = Number.parseInt(ideaForm.durationH, 10)
    const costCZK = Number.parseInt(ideaForm.costCZK, 10)

    if (Number.isNaN(durationH) || Number.isNaN(costCZK)) {
      setIdeaError("Zkontroluj délku a náklady – musí být čísla.")
      return
    }

    const payload = {
      title: ideaForm.title.trim(),
      region: ideaForm.region.trim(),
      durationH,
      costCZK,
      tags,
    }

    startIdeaTransition(async () => {
      try {
        await createTripIdeaAction(payload)
        resetIdeaForm()
        router.refresh()
      } catch (error) {
        setIdeaError(error instanceof Error ? error.message : "Nepodařilo se uložit nápad.")
      }
    })
  }

  async function handleCreateTrip(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTripError(null)

    const budgetLimit = tripForm.budgetLimit
      ? Number.parseInt(tripForm.budgetLimit, 10)
      : null

    if (tripForm.budgetLimit && Number.isNaN(budgetLimit)) {
      setTripError("Limit rozpočtu musí být číslo.")
      return
    }

    const payload = {
      title: tripForm.title.trim(),
      ideaId: tripForm.ideaId ? tripForm.ideaId : null,
      date: tripForm.date,
      notes: tripForm.notes.trim() || null,
      budgetLimitCZK: budgetLimit,
    }

    startTripTransition(async () => {
      try {
        await createTripAction(payload)
        resetTripForm()
        router.refresh()
      } catch (error) {
        setTripError(error instanceof Error ? error.message : "Nepodařilo se naplánovat výlet.")
      }
    })
  }

  async function handleAddBudgetItem(tripId: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const current = budgetForms[tripId] ?? { label: "", amount: "" }
    setBudgetErrors((prev) => ({ ...prev, [tripId]: null }))
    setPendingBudgetTrip(tripId)

    const amountCZK = Number.parseInt(current.amount, 10)

    if (Number.isNaN(amountCZK)) {
      setBudgetErrors((prev) => ({
        ...prev,
        [tripId]: "Částka musí být číslo.",
      }))
      setPendingBudgetTrip(null)
      return
    }

    const payload = {
      tripId,
      label: current.label.trim(),
      amountCZK,
    }

    try {
      await addBudgetItemAction(payload)
      setBudgetForms((prev) => ({ ...prev, [tripId]: { label: "", amount: "" } }))
      router.refresh()
    } catch (error) {
      setBudgetErrors((prev) => ({
        ...prev,
        [tripId]: error instanceof Error ? error.message : "Nepodařilo se přidat položku.",
      }))
    } finally {
      setPendingBudgetTrip(null)
    }
  }

  async function handleToggleTrip(trip: TripDTO) {
    try {
      await toggleTripCompletionAction({
        tripId: trip.id,
        completed: !trip.completed,
      })
      router.refresh()
    } catch (error) {
      console.error("Failed to toggle trip", error)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr] xl:grid-cols-[400px_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nový nápad na výlet</CardTitle>
            <CardDescription>
              Sdílej inspiraci pro rodinné dobrodružství včetně odhadovaného času a nákladů.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateIdea}>
              <div className="space-y-2">
                <Label htmlFor="idea-title">Název</Label>
                <Input
                  id="idea-title"
                  value={ideaForm.title}
                  onChange={(event) =>
                    setIdeaForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Zámek, rozhledna, hřiště…"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idea-region">Region</Label>
                <Input
                  id="idea-region"
                  value={ideaForm.region}
                  onChange={(event) =>
                    setIdeaForm((prev) => ({ ...prev, region: event.target.value }))
                  }
                  placeholder="Jižní Morava"
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Časová náročnost</Label>
                  <Select
                    value={ideaForm.durationH}
                    onValueChange={(value) =>
                      setIdeaForm((prev) => ({ ...prev, durationH: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyber délku" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 hodiny</SelectItem>
                      <SelectItem value="3">3 hodiny</SelectItem>
                      <SelectItem value="4">4 hodiny</SelectItem>
                      <SelectItem value="6">6 hodin</SelectItem>
                      <SelectItem value="8">Celý den</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idea-cost">Odhad nákladů (Kč)</Label>
                  <Input
                    id="idea-cost"
                    type="number"
                    min={0}
                    value={ideaForm.costCZK}
                    onChange={(event) =>
                      setIdeaForm((prev) => ({ ...prev, costCZK: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="idea-tags">Tagy</Label>
                <Input
                  id="idea-tags"
                  value={ideaForm.tags}
                  onChange={(event) =>
                    setIdeaForm((prev) => ({ ...prev, tags: event.target.value }))
                  }
                  placeholder="příroda, voda, děti"
                />
              </div>
              {ideaError ? (
                <p className="text-sm text-destructive">{ideaError}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={isIdeaPending}>
                {isIdeaPending ? "Ukládám…" : "Přidat nápad"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nápadník výletů</CardTitle>
            <CardDescription>
              Filtrovat můžeš podle délky – ideální na odpoledne nebo celodenní toulky.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleGroup
              type="single"
              value={durationFilter}
              onValueChange={(value: DurationFilter | "") => {
                if (!value) return
                setDurationFilter(value)
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="all">Vše</ToggleGroupItem>
              <ToggleGroupItem value="half">2–4 h</ToggleGroupItem>
              <ToggleGroupItem value="full">Celý den</ToggleGroupItem>
            </ToggleGroup>
            <div className="space-y-4">
              {filteredIdeas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Zatím tu není žádný nápad odpovídající filtru.
                </p>
              ) : (
                filteredIdeas.map((idea) => (
                  <div key={idea.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-semibold">{idea.title}</h3>
                        <p className="text-sm text-muted-foreground">{idea.region}</p>
                      </div>
                      <Badge variant="secondary">{idea.durationH} h</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="outline">~{idea.costCZK.toLocaleString("cs-CZ")} Kč</Badge>
                      {idea.tags.map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Naplánovat výlet</CardTitle>
            <CardDescription>
              Vyber konkrétní den, nastav rozpočet a sdílej poznámky pro zbytek rodiny.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateTrip}>
              <div className="space-y-2">
                <Label htmlFor="trip-idea">Nápad</Label>
                <Select
                  value={tripForm.ideaId}
                  onValueChange={(value) => {
                    const selected = ideas.find((idea) => idea.id === value)
                    setTripForm((prev) => ({
                      ...prev,
                      ideaId: value,
                      title: selected ? selected.title : prev.title,
                    }))
                  }}
                >
                  <SelectTrigger id="trip-idea">
                    <SelectValue placeholder="Vyber nápad" />
                  </SelectTrigger>
                  <SelectContent>
                    {ideas.map((idea) => (
                      <SelectItem key={idea.id} value={idea.id}>
                        {idea.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trip-title">Název</Label>
                <Input
                  id="trip-title"
                  value={tripForm.title}
                  onChange={(event) =>
                    setTripForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Rodinná sobota"
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="trip-date">Datum</Label>
                  <Input
                    id="trip-date"
                    type="date"
                    value={tripForm.date}
                    onChange={(event) =>
                      setTripForm((prev) => ({ ...prev, date: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trip-budget">Limit rozpočtu (Kč)</Label>
                  <Input
                    id="trip-budget"
                    type="number"
                    min={0}
                    value={tripForm.budgetLimit}
                    onChange={(event) =>
                      setTripForm((prev) => ({ ...prev, budgetLimit: event.target.value }))
                    }
                    placeholder="např. 1500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trip-notes">Poznámky</Label>
                <Textarea
                  id="trip-notes"
                  value={tripForm.notes}
                  onChange={(event) =>
                    setTripForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Co s sebou, kdo řídí, rezervace…"
                  rows={4}
                />
              </div>
              {tripError ? <p className="text-sm text-destructive">{tripError}</p> : null}
              <Button type="submit" disabled={isTripPending}>
                {isTripPending ? "Plánuji…" : "Uložit do kalendáře"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rodinný kalendář aktivit</CardTitle>
            <CardDescription>
              Přehled všech plánovaných akcí včetně rozpočtu a stavu plnění.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {upcomingTrips.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Zatím nemáte naplánovaný žádný výlet. Přidej první a vytvořte si společné vzpomínky.
              </p>
            ) : (
              upcomingTrips.map((trip) => {
                const totalBudget = trip.budgetItems.reduce(
                  (sum, item) => sum + item.amountCZK,
                  0,
                )
                const overLimit =
                  typeof trip.budgetLimitCZK === "number" && totalBudget > trip.budgetLimitCZK

                const formState = budgetForms[trip.id] ?? { label: "", amount: "" }
                const budgetError = budgetErrors[trip.id]

                return (
                  <div key={trip.id} className="rounded-lg border">
                    <div className="flex flex-col gap-2 border-b p-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{trip.title}</h3>
                          {trip.completed ? (
                            <Badge>Splněno</Badge>
                          ) : (
                            <Badge variant="secondary">Plánováno</Badge>
                          )}
                          {trip.isPast && !trip.completed ? (
                            <Badge variant="outline">Po termínu</Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {trip.idea?.region ?? "Vlastní plán"} · {dateFormatter.format(new Date(trip.date))}
                        </p>
                        {trip.notes ? (
                          <p className="text-sm text-muted-foreground">{trip.notes}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            overLimit ? "text-destructive" : "text-foreground",
                          )}
                        >
                          Rozpočet: {totalBudget.toLocaleString("cs-CZ")} Kč
                          {typeof trip.budgetLimitCZK === "number"
                            ? ` / ${trip.budgetLimitCZK.toLocaleString("cs-CZ")} Kč`
                            : ""}
                        </p>
                        <Button
                          size="sm"
                          variant={trip.completed ? "secondary" : "default"}
                          onClick={() => handleToggleTrip(trip)}
                        >
                          {trip.completed ? "Vrátit mezi plánované" : "Označit splněno"}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4 p-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Položky rozpočtu</p>
                        {trip.budgetItems.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Zatím žádné náklady – přidej položky níže.
                          </p>
                        ) : (
                          <ul className="space-y-2 text-sm">
                            {trip.budgetItems.map((item) => (
                              <li
                                key={item.id}
                                className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2"
                              >
                                <span>{item.label}</span>
                                <span className="font-medium">
                                  {item.amountCZK.toLocaleString("cs-CZ")} Kč
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <Separator />
                      <form
                        className="grid gap-3 md:grid-cols-[2fr_1fr_auto]"
                        onSubmit={(event) => handleAddBudgetItem(trip.id, event)}
                      >
                        <Input
                          placeholder="Název položky"
                          value={formState.label}
                          onChange={(event) =>
                            setBudgetForms((prev) => {
                              const existing = prev[trip.id] ?? { label: "", amount: "" }
                              return {
                                ...prev,
                                [trip.id]: { ...existing, label: event.target.value },
                              }
                            })
                          }
                          required
                        />
                        <Input
                          type="number"
                          min={0}
                          placeholder="Částka"
                          value={formState.amount}
                          onChange={(event) =>
                            setBudgetForms((prev) => {
                              const existing = prev[trip.id] ?? { label: "", amount: "" }
                              return {
                                ...prev,
                                [trip.id]: { ...existing, amount: event.target.value },
                              }
                            })
                          }
                          required
                        />
                        <Button type="submit" disabled={pendingBudgetTrip === trip.id}>
                          {pendingBudgetTrip === trip.id ? "Přidávám…" : "Přidat"}
                        </Button>
                      </form>
                      {budgetError ? (
                        <p className="text-sm text-destructive">{budgetError}</p>
                      ) : null}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
          {upcomingTrips.length > 0 ? (
            <CardFooter className="justify-end text-xs text-muted-foreground">
              Celkem aktivit: {upcomingTrips.length}
            </CardFooter>
          ) : null}
        </Card>
      </div>
    </div>
  )
}
