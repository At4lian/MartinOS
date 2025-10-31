"use client"

import Link from "next/link"
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"

import { AuthCard } from "@/components/auth-card"
import { Button } from "@/components/ui/button"

export function ErrorCard() {
  return (
    <AuthCard
      title="Oops, something went wrong"
      description="We couldn't complete your request right now. Try again or contact support if the problem persists."
      footer={
        <>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link className="underline underline-offset-4" href="#">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link className="underline underline-offset-4" href="#">
              Privacy Policy
            </Link>
            .
          </p>
          <div className="text-sm text-muted-foreground">
            Still need help?{" "}
            <Link
              href="/support"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Contact support
            </Link>
          </div>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <ExclamationTriangleIcon className="size-5 shrink-0" />
          <span>
            Something unexpected happened. You can retry the action or reach out
            to us.
          </span>
        </div>
        <div className="grid gap-2">
          <Button type="button" onClick={() => window.location.reload()}>
            Retry
          </Button>
          <Button variant="outline" asChild>
            <Link href="/support">Contact support</Link>
          </Button>
        </div>
      </div>
    </AuthCard>
  )
}