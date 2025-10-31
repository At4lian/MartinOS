import { ResetForm } from "@/components/reset-form"

export default function ResetPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-lg">
        <ResetForm />
      </div>
    </div>
  )
}
