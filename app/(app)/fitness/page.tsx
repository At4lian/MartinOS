"use client"

import { useEffect, useMemo, useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

import { cn } from "@/lib/utils"

const WORKOUT_TYPES = ["A", "B", "C"] as const

type WorkoutType = (typeof WORKOUT_TYPES)[number]

type WorkoutSession = {
  id: string
  date: string
  type: WorkoutType
  notes?: string
}

type WorkoutSet = {
  id: string
  sessionId: string
  exercise: string
  reps: number
  weightKg: number
  rir: number
}

type HealthMetric = {
  id: string
  date: string
  key: "steps" | "sleep" | "waist"
  value: number
}

const workoutTemplates: Record<
  WorkoutType,
  {
    title: string
    focus: string
    exercises: {
      name: string
      prescription: string
    }[]
  }
> = {
  A: {
    title: "Den A – Silová základna",
    focus:
      "Full-body komplexní tahy pro rozvoj síly a techniky. Udržuj RIR 1-2.",
    exercises: [
      { name: "Back Squat", prescription: "4×5 @ 75-80%" },
      { name: "Bench Press", prescription: "4×6 @ 70%" },
      { name: "Romanian Deadlift", prescription: "3×8" },
      { name: "Pull Ups", prescription: "3×max" },
      { name: "Core Carry", prescription: "3×40 m" },
    ],
  },
  B: {
    title: "Den B – Dynamika & tah",
    focus:
      "Explozivní variace a jednostranné cviky pro vyváženost. Udržuj RIR 2.",
    exercises: [
      { name: "Deadlift", prescription: "3×4 @ 80%" },
      { name: "Overhead Press", prescription: "4×6" },
      { name: "Bulgarian Split Squat", prescription: "3×8/str" },
      { name: "Barbell Row", prescription: "4×8" },
      { name: "Bike Sprint", prescription: "6×20 s" },
    ],
  },
  C: {
    title: "Den C – Hypertrofie & core",
    focus:
      "Vyšší objem s kontrolovanou technikou, RIR 2-3.",
    exercises: [
      { name: "Front Squat", prescription: "4×8" },
      { name: "Incline DB Press", prescription: "4×10" },
      { name: "Lat Pulldown", prescription: "4×12" },
      { name: "Hip Thrust", prescription: "3×12" },
      { name: "Hanging Leg Raise", prescription: "4×12" },
    ],
  },
}

const metricLabels: Record<HealthMetric["key"], string> = {
  steps: "Kroky",
  sleep: "Spánek (h)",
  waist: "Obvod pasu (cm)",
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function Sparkline({
  values,
  color = "#0ea5e9",
  width = 180,
  height = 48,
}: {
  values: number[]
  color?: string
  width?: number
  height?: number
}) {
  const paddedHeight = Math.max(height, 24)
  const minValue = Math.min(...values, 0)
  const maxValue = Math.max(...values, 1)
  const range = maxValue - minValue || 1
  const stepX = values.length > 1 ? width / (values.length - 1) : 0

  const points = values
    .map((value, index) => {
      const normalized = (value - minValue) / range
      const x = stepX * index
      const y = paddedHeight - normalized * (paddedHeight - 8) - 4
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(" ")

  const areaPoints = `0,${paddedHeight} ${points} ${width},${paddedHeight}`

  return (
    <svg
      className="w-full"
      viewBox={`0 0 ${width} ${paddedHeight}`}
      role="img"
      aria-hidden="true"
    >
      <polyline
        fill={`${color}10`}
        stroke="none"
        points={areaPoints}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  )
}

function usePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(initialValue)

  useEffect(() => {
    const stored = window.localStorage.getItem(key)
    if (stored) {
      try {
        setState(JSON.parse(stored))
      } catch (error) {
        console.error("Failed to parse stored state", error)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state))
  }, [key, state])

  return [state, setState] as const
}

export default function FitnessPage() {
  const [selectedType, setSelectedType] = useState<WorkoutType>("A")
  const [sessions, setSessions] = usePersistentState<WorkoutSession[]>(
    "fitness.sessions",
    []
  )
  const [sets, setSets] = usePersistentState<WorkoutSet[]>(
    "fitness.sets",
    []
  )
  const [metrics, setMetrics] = usePersistentState<HealthMetric[]>(
    "fitness.metrics",
    []
  )
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [sessionForm, setSessionForm] = useState({
    date: formatDate(new Date()),
    notes: "",
  })
  const [setForm, setSetForm] = useState({
    exercise: "",
    reps: "",
    weightKg: "",
    rir: "2",
  })
  const [metricForms, setMetricForms] = useState({
    steps: { date: formatDate(new Date()), value: "" },
    sleep: { date: formatDate(new Date()), value: "" },
    waist: { date: formatDate(new Date()), value: "" },
  })

  const sessionsForSelectedType = useMemo(() => {
    return [...sessions]
      .filter((session) => session.type === selectedType)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [sessions, selectedType])

  const fallbackSessionId = sessionsForSelectedType[0]?.id ?? null
  const activeSessionId = selectedSessionId ?? fallbackSessionId

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  )

  const availableExercises = useMemo(() => {
    const templateExercises = workoutTemplates[selectedType].exercises.map(
      (exercise) => exercise.name
    )
    const historyExercises = Array.from(
      new Set(sets.map((set) => set.exercise))
    )
    return Array.from(new Set([...templateExercises, ...historyExercises])).sort()
  }, [selectedType, sets])

  const sessionsByDate = useMemo(() => {
    return [...sessions]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((session) => ({
        ...session,
        sets: sets.filter((set) => set.sessionId === session.id),
      }))
  }, [sessions, sets])

  const last30Days = useMemo(() => {
    return Array.from({ length: 30 }).map((_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - index))
      const key = formatDate(date)
      return { key, label: date.toLocaleDateString("cs-CZ", { month: "2-digit", day: "2-digit" }) }
    })
  }, [])

  const metricSeries = useMemo(() => {
    return (key: HealthMetric["key"]) => {
      return last30Days.map(({ key: dateKey }) => {
        const metricForDay = metrics
          .filter((metric) => metric.key === key && metric.date === dateKey)
          .sort((a, b) => (a.id > b.id ? 1 : -1))
          .at(-1)
        return metricForDay?.value ?? 0
      })
    }
  }, [metrics, last30Days])

  function handleCreateSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sessionForm.date) return
    const newSession: WorkoutSession = {
      id: `session-${crypto.randomUUID()}`,
      date: sessionForm.date,
      type: selectedType,
      notes: sessionForm.notes.trim() || undefined,
    }
    setSessions((previous) => [...previous, newSession])
    setSessionForm({ date: formatDate(new Date()), notes: "" })
    setSelectedSessionId(newSession.id)
  }

  function handleUpdateNotes(notes: string) {
    if (!activeSession) return
    setSessions((previous) =>
      previous.map((session) =>
        session.id === activeSession.id ? { ...session, notes } : session
      )
    )
  }

  function handleAddSet(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeSessionId) return
    const exercise = setForm.exercise.trim()
    const reps = Number.parseInt(setForm.reps, 10)
    const weight = Number.parseFloat(setForm.weightKg)
    const rir = Number.parseInt(setForm.rir, 10)
    if (!exercise || Number.isNaN(reps) || Number.isNaN(weight) || Number.isNaN(rir)) {
      return
    }
    const newSet: WorkoutSet = {
      id: `set-${crypto.randomUUID()}`,
      sessionId: activeSessionId,
      exercise,
      reps,
      weightKg: weight,
      rir,
    }
    setSets((previous) => [...previous, newSet])
    setSetForm((previous) => ({
      ...previous,
      reps: "",
      weightKg: "",
    }))
  }

  function handleMetricSubmit(
    key: HealthMetric["key"],
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    const form = metricForms[key]
    if (!form.date || !form.value) return
    const value = Number.parseFloat(form.value)
    if (Number.isNaN(value)) return
    const newMetric: HealthMetric = {
      id: `${key}-${crypto.randomUUID()}`,
      key,
      date: form.date,
      value,
    }
    setMetrics((previous) => {
      const withoutSameDay = previous.filter(
        (metric) => !(metric.key === key && metric.date === form.date)
      )
      return [...withoutSameDay, newMetric]
    })
    setMetricForms((previous) => ({
      ...previous,
      [key]: { date: formatDate(new Date()), value: "" },
    }))
  }

  const today = formatDate(new Date())
  const todayMetrics = useMemo(() => {
    const lookup = metrics.filter((metric) => metric.date === today)
    return Object.fromEntries(lookup.map((metric) => [metric.key, metric.value])) as Partial<
      Record<HealthMetric["key"], number>
    >
  }, [metrics, today])

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:px-6">
              <Card>
                <CardHeader className="gap-1">
                  <CardTitle>Plán full-body A/B/C</CardTitle>
                  <CardDescription>
                    Přepínej mezi dny a sleduj doporučené cviky, objem a poznámky k technice.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <Tabs
                    value={selectedType}
                    onValueChange={(value) => {
                      setSelectedType(value as WorkoutType)
                      setSelectedSessionId(null)
                    }}
                  >
                    <TabsList>
                      {WORKOUT_TYPES.map((type) => (
                        <TabsTrigger key={type} value={type}>
                          Den {type}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {WORKOUT_TYPES.map((type) => {
                      const template = workoutTemplates[type]
                      return (
                        <TabsContent key={type} value={type} className="mt-4 flex flex-col gap-4">
                          <div>
                            <h3 className="text-lg font-semibold">{template.title}</h3>
                            <p className="text-sm text-muted-foreground">{template.focus}</p>
                          </div>
                          <div className="space-y-2">
                            {template.exercises.map((exercise) => (
                              <div
                                key={exercise.name}
                                className={cn(
                                  "flex items-center justify-between rounded-lg border px-4 py-3",
                                  selectedType === type && "border-primary/40 bg-primary/5"
                                )}
                              >
                                <div>
                                  <p className="font-medium">{exercise.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {exercise.prescription}
                                  </p>
                                </div>
                                <Badge variant="secondary">RIR 1-3</Badge>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      )
                    })}
                  </Tabs>
                  <form
                    onSubmit={handleCreateSession}
                    className="grid gap-3 rounded-lg border bg-muted/40 p-4 sm:grid-cols-[1fr_minmax(0,200px)_auto]"
                  >
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="session-date">Datum</Label>
                      <Input
                        id="session-date"
                        type="date"
                        value={sessionForm.date}
                        onChange={(event) =>
                          setSessionForm((previous) => ({
                            ...previous,
                            date: event.target.value,
                          }))
                        }
                        max={formatDate(new Date())}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="session-notes">Poznámka</Label>
                      <Input
                        id="session-notes"
                        placeholder="Technika, nálada, tempo..."
                        value={sessionForm.notes}
                        onChange={(event) =>
                          setSessionForm((previous) => ({
                            ...previous,
                            notes: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full">
                        Uložit trénink {selectedType}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader className="gap-1">
                  <CardTitle>Zdravotní metriky</CardTitle>
                  <CardDescription>
                    Sleduj kroky, spánek a obvod pasu. Záznamy se přepisují podle dne.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  {(["steps", "sleep", "waist"] as HealthMetric["key"][]).map((key) => (
                    <form
                      key={key}
                      onSubmit={(event) => handleMetricSubmit(key, event)}
                      className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,160px)_auto]"
                    >
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`${key}-date`}>{metricLabels[key]}</Label>
                        <Input
                          id={`${key}-date`}
                          type="date"
                          value={metricForms[key].date}
                          onChange={(event) =>
                            setMetricForms((previous) => ({
                              ...previous,
                              [key]: { ...previous[key], date: event.target.value },
                            }))
                          }
                          max={formatDate(new Date())}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`${key}-value`}>Hodnota</Label>
                        <Input
                          id={`${key}-value`}
                          type="number"
                          step={key === "sleep" ? "0.25" : "1"}
                          min={0}
                          value={metricForms[key].value}
                          onChange={(event) =>
                            setMetricForms((previous) => ({
                              ...previous,
                              [key]: { ...previous[key], value: event.target.value },
                            }))
                          }
                          placeholder={key === "steps" ? "8000" : key === "sleep" ? "7.5" : "82"}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button type="submit" className="w-full">
                          Uložit
                        </Button>
                      </div>
                    </form>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:px-6">
              <Card>
                <CardHeader className="gap-1">
                  <CardTitle>Log tréninků</CardTitle>
                  <CardDescription>
                    Vyber aktivní trénink a zadávej série v reálném čase.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <div className="flex flex-wrap items-center gap-3">
                    {WORKOUT_TYPES.map((type) => {
                      const isActive = selectedType === type
                      return (
                        <Button
                          key={type}
                          type="button"
                          variant={isActive ? "default" : "outline"}
                          onClick={() => {
                            setSelectedType(type)
                            setSelectedSessionId(null)
                          }}
                        >
                          Den {type}
                        </Button>
                      )
                    })}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="session-picker">Zvol trénink</Label>
                    <select
                      id="session-picker"
                      className="h-9 rounded-md border px-3 text-sm"
                    value={selectedSessionId ?? ""}
                    onChange={(event) =>
                      setSelectedSessionId(event.target.value || null)
                    }
                  >
                    <option value="">Vyber uložený záznam</option>
                      {sessionsForSelectedType.map((session) => (
                        <option key={session.id} value={session.id}>
                          {session.date} · Den {session.type}
                        </option>
                      ))}
                  </select>
                </div>
                  {activeSession ? (
                    <div className="flex flex-col gap-4">
                      <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Datum</p>
                            <p className="font-semibold">{activeSession.date}</p>
                          </div>
                          <Badge variant="outline">Den {activeSession.type}</Badge>
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                          <Label htmlFor="session-notes-editor">Poznámky k tréninku</Label>
                          <Textarea
                            id="session-notes-editor"
                            rows={3}
                            value={activeSession.notes ?? ""}
                            onChange={(event) => handleUpdateNotes(event.target.value)}
                            placeholder="Jak se trénink povedl? Zapiš tempo, mobilitu nebo mindset."
                          />
                        </div>
                      </div>

                      <form
                        onSubmit={handleAddSet}
                        className="grid gap-3 rounded-lg border bg-muted/20 p-4 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]"
                      >
                        <div className="flex flex-col gap-2 lg:col-span-2">
                          <Label htmlFor="exercise-input">Cvik</Label>
                          <Input
                            id="exercise-input"
                            list="exercise-options"
                            placeholder="Začni psát název cviku"
                            value={setForm.exercise}
                            onChange={(event) =>
                              setSetForm((previous) => ({
                                ...previous,
                                exercise: event.target.value,
                              }))
                            }
                          />
                          <datalist id="exercise-options">
                            {availableExercises.map((exercise) => (
                              <option key={exercise} value={exercise} />
                            ))}
                          </datalist>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="reps-input">Opakování</Label>
                          <Input
                            id="reps-input"
                            type="number"
                            min={1}
                            value={setForm.reps}
                            onChange={(event) =>
                              setSetForm((previous) => ({
                                ...previous,
                                reps: event.target.value,
                              }))
                            }
                            placeholder="8"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="weight-input">Váha (kg)</Label>
                          <Input
                            id="weight-input"
                            type="number"
                            step="0.5"
                            min={0}
                            value={setForm.weightKg}
                            onChange={(event) =>
                              setSetForm((previous) => ({
                                ...previous,
                                weightKg: event.target.value,
                              }))
                            }
                            placeholder="60"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="rir-input">RIR</Label>
                          <Input
                            id="rir-input"
                            type="number"
                            min={0}
                            max={5}
                            value={setForm.rir}
                            onChange={(event) =>
                              setSetForm((previous) => ({
                                ...previous,
                                rir: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-end">
                          <Button type="submit" className="w-full">
                            Přidat sérii
                          </Button>
                        </div>
                      </form>

                      <div className="space-y-4">
                        {Object.entries(
                          sets
                            .filter((set) => set.sessionId === activeSession.id)
                            .reduce<Record<string, WorkoutSet[]>>((accumulator, current) => {
                              accumulator[current.exercise] = accumulator[current.exercise] ?? []
                              accumulator[current.exercise].push(current)
                              return accumulator
                            }, {})
                        ).map(([exercise, exerciseSets]) => {
                          const totalVolume = exerciseSets.reduce(
                            (sum, set) => sum + set.reps * set.weightKg,
                            0
                          )
                          return (
                            <div
                              key={exercise}
                              className="rounded-lg border bg-background p-4 shadow-xs"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="font-semibold">{exercise}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {exerciseSets.length} sérií · objem {totalVolume.toFixed(1)} kg
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 flex flex-col gap-2">
                                {exerciseSets.map((set) => (
                                  <div
                                    key={set.id}
                                    className="grid grid-cols-[minmax(0,1fr)_repeat(3,auto)] items-center gap-2 text-sm"
                                  >
                                    <span className="text-muted-foreground">{set.reps} opak.</span>
                                    <span className="font-medium">{set.weightKg} kg</span>
                                    <span className="text-muted-foreground">RIR {set.rir}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() =>
                                        setSets((previous) =>
                                          previous.filter((candidate) => candidate.id !== set.id)
                                        )
                                      }
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                        {sets.filter((set) => set.sessionId === activeSession.id).length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Začni přidávat série pro tento trénink, údaje se uloží automaticky.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Vytvoř nebo vyber trénink pro den {selectedType} a začni zapisovat série.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="gap-1">
                  <CardTitle>30denní trend</CardTitle>
                  <CardDescription>
                    Jednoduchý přehled kroků a spánku za posledních 30 dní.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  {(["steps", "sleep"] as HealthMetric["key"][]).map((key) => {
                    const values = metricSeries(key)
                    const average =
                      values.reduce((sum, value) => sum + value, 0) / (values.length || 1)
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{metricLabels[key]}</p>
                            <p className="text-xl font-semibold">
                              {key === "sleep" ? average.toFixed(1) : Math.round(average).toLocaleString("cs-CZ")} průměr
                            </p>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>Dnes: {todayMetrics[key]?.toLocaleString("cs-CZ") ?? "–"}</p>
                            <p>Posledních 7 dní: {values.slice(-7).reduce((sum, value) => sum + value, 0).toLocaleString("cs-CZ")}</p>
                          </div>
                        </div>
                        <Sparkline
                          values={values}
                          color={key === "sleep" ? "#8b5cf6" : "#0ea5e9"}
                          height={56}
                        />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>

            <div className="px-4 lg:px-6">
              <Card>
                <CardHeader className="gap-1">
                  <CardTitle>Historie tréninků</CardTitle>
                  <CardDescription>
                    Kompletní přehled posledních záznamů včetně sérií a poznámek.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {sessionsByDate.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Zatím nemáš uložený žádný trénink. Začni přidáním dne {selectedType}.
                    </p>
                  ) : (
                    sessionsByDate.map((session) => {
                      const sessionSets = session.sets
                      const totalVolume = sessionSets.reduce(
                        (sum, set) => sum + set.weightKg * set.reps,
                        0
                      )
                      return (
                        <div
                          key={session.id}
                          className="rounded-xl border bg-background p-4 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                {session.date} · Den {session.type}
                              </p>
                              <p className="font-semibold">
                                {workoutTemplates[session.type].title}
                              </p>
                            </div>
                            <Badge variant="outline">
                              Objem {totalVolume.toFixed(1)} kg
                            </Badge>
                          </div>
                          {session.notes && (
                            <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm">
                              {session.notes}
                            </p>
                          )}
                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {Object.entries(
                              sessionSets.reduce<Record<string, WorkoutSet[]>>(
                                (accumulator, current) => {
                                  accumulator[current.exercise] =
                                    accumulator[current.exercise] ?? []
                                  accumulator[current.exercise].push(current)
                                  return accumulator
                                },
                                {}
                              )
                            ).map(([exercise, exerciseSets]) => (
                              <div key={exercise} className="rounded-lg border bg-muted/20 p-3">
                                <p className="font-medium">{exercise}</p>
                                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                  {exerciseSets.map((set) => (
                                    <div key={set.id} className="flex justify-between">
                                      <span>
                                        {set.reps} × {set.weightKg} kg
                                      </span>
                                      <span>RIR {set.rir}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            {sessionSets.length === 0 && (
                              <p className="text-sm text-muted-foreground">
                                Bez zapsaných sérií.
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

