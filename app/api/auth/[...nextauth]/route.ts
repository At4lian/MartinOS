import { handlers } from "@/auth"
import { withRateLimit } from "@/lib/rate-limit"

export const GET = withRateLimit(handlers.GET)
export const POST = withRateLimit(handlers.POST)
