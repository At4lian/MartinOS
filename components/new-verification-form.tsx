'use client'

import { BeatLoader } from "react-spinners"
import {  useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import { FormError } from "@/components/form-error"
import { FormSuccess } from "@/components/form-success"
import { newVerification } from "@/actions/new-verification"
import { Link } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"

export function NewVerificationForm() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | undefined>()
  const [success, setSuccess] = useState<string | undefined>()

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      return
    }

    newVerification(token)
      .then((data) => {
        setSuccess(data.success)
        setError(data.error)
      })
      .catch(() => {
        setError('Something went wrong!')
      })
  }, [token])

  // Handle missing token case outside of useEffect
  if (!token) {
    return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
      <div className="flex flex-col gap-6 p-6">
        <Card className="overflow-hidden">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-2xl font-bold">Confirming your verification</h1>
                </div>
                <div className="flex items-center w-full justify-center">
                  <FormError message="Missing token!" />
                </div>
                <Button variant="link" className="font-normal w-full" asChild>
                  <Link href="/auth/login">
                    Back to login
                  </Link>
                </Button>
              </div>
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
      </div>
      </div>
      </div>
    )
  }

  return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
    <div className="flex flex-col gap-6 p-6">
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6">
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold">Confirming your verification</h1>
              </div>
              <div className="flex items-center w-full justify-center">
                {!success && !error && (
                  <BeatLoader />
                )}
                <FormSuccess message={success} />
                <FormError message={error} />
              </div>
              <Button variant="link" className="font-normal w-full" asChild>
                <Link href="/auth/login">
                  Back to login
                </Link>
              </Button>
            </div>
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
    </div>
    </div>
      </div>
  )
}