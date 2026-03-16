// Currency formatting utility — default Rp (IDR)
export type CurrencyCode = "IDR" | "USD" | "EUR" | "GBP";

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "IDR", label: "Indonesian Rupiah", symbol: "Rp" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
];

const CURRENCY_KEY = "app_currency";

export function getCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "IDR";
  return (localStorage.getItem(CURRENCY_KEY) as CurrencyCode) || "IDR";
}

export function setCurrency(code: CurrencyCode) {
  localStorage.setItem(CURRENCY_KEY, code);
}

export function formatCurrency(value: number, currency?: CurrencyCode): string {
  const code = currency ?? getCurrency();
  if (code === "IDR") {
    return `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
