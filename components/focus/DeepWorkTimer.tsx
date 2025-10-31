"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const DURATIONS = [25, 50, 90] as const
const STORAGE_KEY = "focus:last-session"

type TimerStatus = "idle" | "running" | "paused" | "completed"

type StoredSession = {
  duration: number
  startedAt: string
  finishedAt: string | null
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`
}

function playBeep() {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    oscillator.type = "sine"
    oscillator.frequency.value = 880
    oscillator.connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.25)
  } catch (error) {
    console.error("Unable to play notification sound", error)
  }
}

export function DeepWorkTimer() {
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(25)
  const [remaining, setRemaining] = useState(duration * 60)
  const [status, setStatus] = useState<TimerStatus>("idle")
  const startTimestampRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [lastSession, setLastSession] = useState<StoredSession | null>(() => {
    if (typeof window === "undefined") {
      return null
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        return null
      }
      const parsed = JSON.parse(raw) as StoredSession
      return parsed?.duration ? parsed : null
    } catch (error) {
      console.warn("Failed to read stored focus session", error)
      return null
    }
  })

  const persistSession = useCallback((session: StoredSession) => {
    if (typeof window === "undefined") {
      return
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    setLastSession(session)
  }, [])

  const clearIntervalRef = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const handleSelectDuration = useCallback(
    (nextDuration: (typeof DURATIONS)[number]) => {
      if (status === "running") {
        return
      }
      setDuration(nextDuration)
      setRemaining(nextDuration * 60)
      setStatus("idle")
      startTimestampRef.current = null
      clearIntervalRef()
    },
    [clearIntervalRef, status]
  )

  const tick = useCallback(() => {
    if (startTimestampRef.current === null) {
      return
    }
    const elapsed = Math.floor((Date.now() - startTimestampRef.current) / 1000)
    const total = duration * 60
    const nextRemaining = Math.max(total - elapsed, 0)
    setRemaining(nextRemaining)
    if (nextRemaining === 0) {
      clearIntervalRef()
      startTimestampRef.current = null
      setStatus("completed")
      playBeep()
      persistSession({
        duration,
        startedAt: new Date(Date.now() - total * 1000).toISOString(),
        finishedAt: new Date().toISOString(),
      })
    }
  }, [clearIntervalRef, duration, persistSession])

  const startTimer = useCallback(() => {
    if (status === "running") {
      return
    }
    const total = duration * 60
    const alreadyElapsed = total - remaining
    startTimestampRef.current = Date.now() - alreadyElapsed * 1000
    setStatus("running")
    clearIntervalRef()
    intervalRef.current = setInterval(tick, 500)
    if (status === "idle") {
      persistSession({
        duration,
        startedAt: new Date().toISOString(),
        finishedAt: null,
      })
    }
  }, [clearIntervalRef, duration, persistSession, remaining, status, tick])

  const pauseTimer = useCallback(() => {
    if (status !== "running") {
      return
    }
    clearIntervalRef()
    startTimestampRef.current = null
    setStatus("paused")
  }, [clearIntervalRef, status])

  const resetTimer = useCallback(() => {
    clearIntervalRef()
    startTimestampRef.current = null
    setRemaining(duration * 60)
    setStatus("idle")
  }, [clearIntervalRef, duration])

  useEffect(() => {
    return () => {
      clearIntervalRef()
    }
  }, [clearIntervalRef])

  const progress = useMemo(() => {
    const total = duration * 60
    return Math.round(((total - remaining) / total) * 100)
  }, [duration, remaining])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Deep Work</CardTitle>
        <CardDescription>
          Select a session and stay focused. The timer keeps counting even when you
          switch tabs.
        </CardDescription>
        {lastSession ? (
          <p className="text-xs text-muted-foreground">
            Last session: {lastSession.duration} min started at {" "}
            {new Date(lastSession.startedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {lastSession.finishedAt
              ? ` and completed at ${new Date(lastSession.finishedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : " (in progress)"}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex gap-2">
          {DURATIONS.map((item) => (
            <Button
              key={item}
              variant={item === duration ? "default" : "outline"}
              onClick={() => handleSelectDuration(item)}
              disabled={status === "running"}
            >
              {item} min
            </Button>
          ))}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border bg-muted/40 p-6 text-center">
          <span className="text-5xl font-semibold tabular-nums">
            {formatTime(remaining)}
          </span>
          <div className="flex w-full max-w-sm overflow-hidden rounded-full border">
            <div
              className={cn("h-2 bg-primary transition-[width]", {
                "bg-emerald-500": status === "completed",
              })}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {status !== "running" ? (
              <Button onClick={startTimer}>
                {status === "paused" ? "Resume" : "Start"}
              </Button>
            ) : (
              <Button onClick={pauseTimer} variant="secondary">
                Pause
              </Button>
            )}
            <Button variant="ghost" onClick={resetTimer}>
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
