"use client"

import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { LoginSchema, loginSchema } from "@/schemas"
import { FormError } from "./form-error"
import { FormSuccess } from "./form-success"
import { zodResolver } from '@hookform/resolvers/zod'
import { login } from "@/actions/login"
import Link from "next/link"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

export function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')
  const urlError = searchParams.get('error') === 'OAuthAccountNotLinked'
    ? 'Email already in use with different provider!'
    : ''

  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [error, setError] = useState<string | undefined>('')
  const [success, setSuccess] = useState<string | undefined>('')
  const [pending, startTransition] = useTransition()

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  })

function onLoginSubmit(values: LoginSchema) {
    setError('')
    setSuccess('')

    startTransition(() => {
      login(values, callbackUrl)
        .then((data) => {
          if (data?.error) {
            form.reset()
            setError(data.error)
          }

          if (data?.success) {
            form.reset()
            setSuccess(data?.success)
          }

          if (data?.twoFactor) {
            setShowTwoFactor(true)
          }
        })
        .catch(() => setError('Something went wrong!'))
    })
  }

  return (
    <div className={cn("flex flex-col gap-6 p-6")}>
      <Card className="overflow-hidden">
      <CardContent className="grid p-0 md:grid-cols-2">
        <div className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onLoginSubmit)} className="space-y-6">
          <div className="space-y-4">
            {showTwoFactor && (
            <FormField 
            control={form.control}
            name="code"
            render={({field}) => (
              <FormItem>
              <FormLabel>Two Factor Code</FormLabel>
              <FormControl>
                <Input
                type="text"
                placeholder="123456" 
                disabled={pending}
                {...field}
                />
              </FormControl>
              <FormMessage />
              </FormItem>
            )}
            />
            )}
            {!showTwoFactor && (
            <>
              <FormField 
              control={form.control}
              name="email"
              render={({field}) => (
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
              <FormField 
              control={form.control}
              name="password"
              render={({field}) => (
                <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                  type="password"
                  placeholder="*******"
                  disabled={pending}
                  {...field}
                  />
                </FormControl>
                <Button size="sm" variant="link" className="px-0 font-normal" asChild>
                  <Link href="/auth/reset">
                  Forgot password?
                  </Link>
                </Button>
                <FormMessage />
                </FormItem>
              )}
              />
            </>
            )}
          </div>
          <FormError message={error || urlError} />
          <FormSuccess message={success} />
          <Button type="submit" disabled={pending} className="w-full">
            {showTwoFactor ? 'Confirm' : 'Login'}
          </Button>
          </form>
        </Form>
        <Button variant="link" className="font-normal w-full" asChild>
          <Link href="/auth/signup">
            <span>Don&apos;t have an account?</span>
          </Link>
        </Button>
        </div>
        <div className="bg-muted relative hidden md:block">
                 <img
              src="/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
        </div>
      </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
      By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
      and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
