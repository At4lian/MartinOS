"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import Link from "next/link"

import { reset } from "@/actions/reset"
import { ResetSchema, resetSchema } from "@/schemas"
import { zodResolver } from "@hookform/resolvers/zod"

import { AuthCard } from "@/components/auth-card"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FormError } from "@/components/form-error"
import { FormSuccess } from "@/components/form-success"

export function ResetForm() {
  const [error, setError] = useState<string | undefined>("")
  const [success, setSuccess] = useState<string | undefined>("")
  const [pending, startTransition] = useTransition()

  const form = useForm<ResetSchema>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  })

  function onResetSubmit(values: ResetSchema) {
    setError("")
    setSuccess("")

    startTransition(() => {
      reset(values)
        .then((data) => {
          setError(data.error)
          setSuccess(data.success)
        })
        .catch(() => setError("Something went wrong!"))
    })
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter the email associated with your account and we&apos;ll send you a reset link."
      footer={
        <div className="text-sm text-muted-foreground">
          Remembered your password?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to login
          </Link>
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onResetSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="example@email.com"
                    disabled={pending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-3">
            <FormError message={error} />
            <FormSuccess message={success} />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            Send reset link
          </Button>
        </form>
      </Form>
    </AuthCard>
  )
}
