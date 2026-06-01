export function formatFinanceAmount(amount: number, showDecimals: boolean) {
  const fractionDigits = showDecimals ? 2 : 0

  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount)
}
