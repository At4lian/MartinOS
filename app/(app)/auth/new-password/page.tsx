import { NewPasswordForm } from "@/components/new-password-form"

export default function NewPasswordPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-lg">
        <NewPasswordForm />
      </div>
    </div>
  )
}
