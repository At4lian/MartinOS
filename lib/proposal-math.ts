export type PriceItemMathInput = {
  qty: number
  unitPriceCZK: number
  vatRate: number
}

export type ProposalTotals = {
  subtotalCZK: number
  vatCZK: number
  totalCZK: number
  marginRatio: number
}

export function calculateProposalTotals(
  items: PriceItemMathInput[],
): ProposalTotals {
  let subtotal = 0
  let vat = 0

  for (const item of items) {
    const quantity = Number.isFinite(item.qty) ? item.qty : 0
    const unitPrice = Number.isFinite(item.unitPriceCZK) ? item.unitPriceCZK : 0
    const rate = Number.isFinite(item.vatRate) ? item.vatRate : 0

    const base = Math.round(quantity * unitPrice)
    const itemVat = Math.round(base * rate)

    subtotal += base
    vat += itemVat
  }

  const total = subtotal + vat
  const margin = total === 0 ? 0 : vat / total

  return {
    subtotalCZK: subtotal,
    vatCZK: vat,
    totalCZK: total,
    marginRatio: margin,
  }
}
