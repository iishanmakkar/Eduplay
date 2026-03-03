export function formatCurrency(amount: number, currencyCode: string = 'USD', locale: string = 'en-US') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function formatCurrencyCompact(amount: number, currencyCode: string = 'USD', locale: string = 'en-US') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(amount)
}
