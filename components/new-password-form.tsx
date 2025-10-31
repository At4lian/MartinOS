'use client'

import Link from "next/link"
import { useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { newPassword } from "@/actions/new-password"
import { FormError } from "@/components/form-error"
import { FormSuccess } from "@/components/form-success"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { NewPasswordSchema, newPasswordSchema } from "@/schemas"

export function NewPasswordForm() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | undefined>("")
  const [success, setSuccess] = useState<string | undefined>("")
  const [pending, startTransition] = useTransition()
  const token = searchParams.get("token")

  const form = useForm<NewPasswordSchema>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: "",
    },
  })

  function onNewPasswordSubmit(values: NewPasswordSchema) {
    if (!token) {
      setError("Missing token!")
      return
    }

    startTransition(() => {
      newPassword(values, token).then((data) => {
        setError(data.error)
        setSuccess(data.success)
      })
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="flex flex-col justify-center gap-6 p-6">
            <div className="space-y-2 text-center md:text-left">
              <CardTitle>Set a new password</CardTitle>
              <CardDescription>
                Choose a strong password to secure your account.
              </CardDescription>
            </div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onNewPasswordSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="********"
                          disabled={pending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormError message={error} />
                <FormSuccess message={success} />
                <Button type="submit" disabled={pending} className="w-full">
                  Reset password
                </Button>
              </form>
            </Form>
          </div>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholder.svg"
              alt="Security illustration"
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