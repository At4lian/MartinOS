const currencyFormatter = new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat("cs-CZ", {
  style: "percent",
  maximumFractionDigits: 0,
})

export function formatCurrencyCZK(value: number) {
  return currencyFormatter.format(value)
}

export function formatPercent(value: number) {
  return percentFormatter.format(value)
}
