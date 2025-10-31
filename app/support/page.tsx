import Link from "next/link"
import type { Metadata } from "next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LifeBuoy, Mail, MessageCircle } from "lucide-react"

const faqs = [
  {
    question: "How quickly will someone respond?",
    answer:
      "Our support specialists respond to new requests within one business day. Enterprise plans receive priority routing with a four-hour response time window.",
  },
  {
    question: "Where can I view current platform status?",
    answer:
      "Visit the status dashboard to see real-time service availability, incident history, and maintenance schedules. You can also subscribe to automated email updates.",
  },
  {
    question: "Do you offer implementation assistance?",
    answer:
      "Yes. Our solutions team provides guided onboarding, integration reviews, and best-practice recommendations tailored to your stack and compliance needs.",
  },
]

export const metadata: Metadata = {
  title: "Support | MartinAuth",
  description:
    "Get help from the MartinAuth team, browse troubleshooting resources, and reach our customer success specialists.",
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/40 to-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-16 sm:px-8 lg:gap-20 lg:py-24">
        <header className="space-y-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">
            Need a hand?
          </p>
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              We&apos;re here to help you stay secure
            </h1>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
              Reach out to our support team, browse implementation resources, or check the latest status updates. We&apos;ll make sure you get the answers you need.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="mailto:support@martinauth.com">Email support</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="https://status.martinauth.com" target="_blank" rel="noreferrer">
                View status page
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-start gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <LifeBuoy className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle className="text-xl">Create a support request</CardTitle>
                  <CardDescription>
                    Share a few details about what you&apos;re working on and we&apos;ll connect you with the right person.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4" action="https://martinauth.com/support" method="post">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Work email</Label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="topic">How can we help?</Label>
                    <Input
                      id="topic"
                      name="topic"
                      placeholder="Account access, configuration, billing..."
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="details">Additional details</Label>
                    <textarea
                      id="details"
                      name="details"
                      placeholder="Share links, timelines, or anything else that will help us resolve this quickly."
                      className="min-h-[120px] resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <Button type="submit" size="lg">
                    Submit request
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    By submitting, you agree to our service terms and acknowledge our privacy policy.
                  </p>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MessageCircle className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle className="text-xl">Chat with customer success</CardTitle>
                  <CardDescription>
                    Schedule a 20-minute session with our specialists to troubleshoot complex issues together.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Available Monday–Friday from 8:00 AM to 6:00 PM (UTC-5). Choose a time that works best for your team.
                </p>
                <Button asChild variant="secondary">
                  <Link href="https://cal.martinauth.com/support" target="_blank" rel="noreferrer">
                    Book a session
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Mail className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle className="text-xl">Prefer to self-serve?</CardTitle>
                  <CardDescription>
                    Explore integration guides, FAQs, and product updates curated by our solutions engineers.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <Link className="font-medium text-primary underline-offset-4 hover:underline" href="https://docs.martinauth.com">
                    Documentation portal
                  </Link>
                  <Link className="font-medium text-primary underline-offset-4 hover:underline" href="https://community.martinauth.com">
                    Community discussions
                  </Link>
                  <Link className="font-medium text-primary underline-offset-4 hover:underline" href="https://martinauth.com/changelog">
                    Product changelog
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="flex flex-col justify-between gap-8">
            <Card className="bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="text-2xl">Current incident response</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  If you&apos;re experiencing an outage, check incident updates and subscribe for email notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border border-primary-foreground/30 bg-primary-foreground/5 p-4 text-sm text-primary-foreground/90">
                  <p className="font-medium">All systems operational</p>
                  <p className="text-xs opacity-80">Last updated: Today at 09:30 UTC</p>
                </div>
                <Button asChild variant="secondary" size="lg">
                  <Link href="https://status.martinauth.com/subscribe" target="_blank" rel="noreferrer">
                    Subscribe to updates
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Frequently asked questions</CardTitle>
                <CardDescription>Quick answers to the topics we hear about most.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {faqs.map((faq) => (
                  <div key={faq.question} className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </div>
  )
}
