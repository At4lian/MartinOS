"use client"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface AuthCardProps {
  children: React.ReactNode
  title: string
  description?: string
  footer?: React.ReactNode
  className?: string
}

export function AuthCard({
  children,
  title,
  description,
  footer,
  className,
}: AuthCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/50 bg-background/90 shadow-xl backdrop-blur",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
      <CardHeader className="space-y-3 px-8 text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-sm text-muted-foreground">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="px-8 pb-8 text-left">
        {children}
      </CardContent>
      {footer ? (
        <CardFooter className="flex flex-col items-center gap-4 px-8 pb-8 text-center text-sm text-muted-foreground">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  )
}
