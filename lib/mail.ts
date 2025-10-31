import { Resend } from 'resend'

import { env } from '@/lib/env'

const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null
const fromEmail = env.RESEND_FROM_EMAIL

function assertMailer() {
  if (!resendClient || !fromEmail) {
    throw new Error('Email service is not configured')
  }

  return { resend: resendClient, from: fromEmail }
}

export async function sendVerificationEmail(
  email: string,
  token: string,
) {
  const confirmLink = new URL(`/auth/new-verification?token=${token}`, env.NEXT_PUBLIC_APP_URL).toString()
  const { resend, from } = assertMailer()

  await resend.emails.send({
    from,
    to: email,
    subject: 'Confirm your email',
    html: `<p>Click <a href="${confirmLink}">here</a> to confirm email.</p>`
  })
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
) {
  const resetLink = new URL(`/auth/new-password?token=${token}`, env.NEXT_PUBLIC_APP_URL).toString()
  const { resend, from } = assertMailer()

  await resend.emails.send({
    from,
    to: email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
  })
}

export async function sendTwoFactorTokenEmail(
  email: string,
  token: string,
) {
  const { resend, from } = assertMailer()

  await resend.emails.send({
    from,
    to: email,
    subject: '2FA Code',
    html: `<p>Your 2FA Code: ${token}</p>`
  })
}