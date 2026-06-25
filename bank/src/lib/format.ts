const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number, currency = "USD"): string {
  if (currency === "USD") return currencyFormatter.format(value)
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value)
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export function maskAccount(accountNumber: string): string {
  if (!accountNumber) return ""
  const last4 = accountNumber.slice(-4)
  return `\u2022\u2022\u2022\u2022 ${last4}`
}
