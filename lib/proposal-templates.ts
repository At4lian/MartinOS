import { DEFAULT_VAT_RATE } from "@/lib/constants"
import type { ProposalTemplate } from "@/types/proposals"

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  {
    id: "web-redesign",
    title: "Web Redesign",
    description: "Kompletní redesign marketingového webu",
    scopeMd: `## Rozsah
- Analýza současného webu
- Redesign UX/UI
- Implementace v Next.js
- Testování a nasazení`,
    timelineMd: `## Harmonogram
- Týden 1–2: Analýza a návrh
- Týden 3–4: Implementace
- Týden 5: Testování
- Týden 6: Nasazení a předání`,
    priceItems: [
      { label: "UX/UI návrh", qty: 1, unitPriceCZK: 65000, vatRate: DEFAULT_VAT_RATE },
      { label: "Frontend vývoj", qty: 1, unitPriceCZK: 92000, vatRate: DEFAULT_VAT_RATE },
      { label: "Testování a QA", qty: 1, unitPriceCZK: 18000, vatRate: DEFAULT_VAT_RATE },
    ],
  },
  {
    id: "crm-implementation",
    title: "Implementace CRM",
    description: "Nasazení CRM a onboarding týmu",
    scopeMd: `## Rozsah
- Audit současného procesu
- Konfigurace CRM
- Integrace e-mailu a kalendáře
- Školení týmu`,
    timelineMd: `## Harmonogram
- Týden 1: Audit a plán
- Týden 2: Konfigurace CRM
- Týden 3: Integrace
- Týden 4: Školení a předání`,
    priceItems: [
      { label: "Analýza a plánování", qty: 1, unitPriceCZK: 38000, vatRate: DEFAULT_VAT_RATE },
      { label: "Implementace", qty: 1, unitPriceCZK: 54000, vatRate: DEFAULT_VAT_RATE },
      { label: "Školení", qty: 1, unitPriceCZK: 22000, vatRate: DEFAULT_VAT_RATE },
    ],
  },
  {
    id: "support-retainer",
    title: "Měsíční support retainer",
    description: "Měsíční balíček pro vývoj a support",
    scopeMd: `## Rozsah
- Prioritizace úkolů
- 40 hodin vývoje měsíčně
- Incident support
- Reporting a doporučení`,
    timelineMd: `## Harmonogram
- Start do 1 týdne od podpisu
- Měsíční vyhodnocení
- Přehled čerpání hodin`,
    priceItems: [
      { label: "Retainer (40h)", qty: 1, unitPriceCZK: 75000, vatRate: DEFAULT_VAT_RATE },
    ],
  },
]
