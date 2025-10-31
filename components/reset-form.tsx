'use client'

import Link from "next/link"
import { useState, useTransition } from "react"
import { EnvelopeClosedIcon } from "@radix-ui/react-icons"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { reset } from "@/actions/reset"
import { FormError } from "@/components/form-error"
import { FormSuccess } from "@/components/form-success"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { ResetSchema, resetSchema } from "@/schemas"

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
      reset(values).then((data) => {
        setError(data?.error)
        setSuccess(data?.success)
      })
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <EnvelopeClosedIcon className="size-6" />
            </div>
            <div className="space-y-2">
              <CardTitle>Reset your password</CardTitle>
              <CardDescription>
                Enter the email address associated with your account and we&apos;ll send you a reset link.
              </CardDescription>
            </div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onResetSubmit)}
                className="flex w-full max-w-sm flex-col gap-4 text-left"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="example@email.com"
                          disabled={pending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <FormError message={error} />
                  <FormSuccess message={success} />
                </div>
                <Button type="submit" disabled={pending} className="w-full">
                  Send reset email
                </Button>
              </form>
            </Form>
          </div>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholder.svg"
              alt="Reset illustration"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <p className="px-6 text-center text-sm text-muted-foreground">
        By continuing, you agree to our{" "}
        <Link href="#" className="underline underline-offset-4">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}