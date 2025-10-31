"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import Link from "next/link"

import { register } from "@/actions/register"
import { RegisterSchema, registerSchema } from "@/schemas"
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
import { FieldDescription } from "@/components/ui/field"
import { FormError } from "@/components/form-error"
import { FormSuccess } from "@/components/form-success"

export function SignupForm() {
  const [error, setError] = useState<string | undefined>("")
  const [success, setSuccess] = useState<string | undefined>("")
  const [pending, startTransition] = useTransition()

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  function onRegisterSubmit(values: RegisterSchema) {
    setError("")
    setSuccess("")

    startTransition(() => {
      register(values).then((data) => {
        setError(data.error)
        setSuccess(data.success)
      })
    })
  }

  return (
    <AuthCard
      title="Create your account"
      description="Join MartinAuth and start building secure experiences."
      footer={
        <>
          <FieldDescription className="text-center text-xs leading-relaxed text-muted-foreground">
            By creating an account, you agree to our
            {" "}
            <Link className="underline underline-offset-4" href="#">
              Terms of Service
            </Link>{" "}
            and
            {" "}
            <Link className="underline underline-offset-4" href="#">
              Privacy Policy
            </Link>
            .
          </FieldDescription>
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onRegisterSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      autoComplete="name"
                      placeholder="John Doe"
                      disabled={pending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Create a strong password"
                      disabled={pending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-3">
            <FormError message={error} />
            <FormSuccess message={success} />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            Create account
          </Button>
        </form>
      </Form>
    </AuthCard>
  )
}
