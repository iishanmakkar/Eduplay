import { prisma } from '@/lib/prisma'
import { SubscriptionPlan } from '@prisma/client'

export interface BillingConfig {
    plan: SubscriptionPlan
    currencyCode: string
    symbol: string
    amount: number        // Base amount in currency
    amountSmallestUnit: number // In paise, cents
    taxRate: number
    totalWithTax: number  // in smallest unit
    provider: 'RAZORPAY' | 'STRIPE'
}

export async function getBillingDetails(
    plan: SubscriptionPlan,
    billingCycle: 'monthly' | 'annual',
    countryCode: string = 'US'
): Promise<BillingConfig> {

    // Attempt localized price, fallback to US
    let regionalPrice = await prisma.regionalPrice.findUnique({
        where: { plan_countryCode: { plan, countryCode } },
        include: { currency: true }
    })

    if (!regionalPrice && countryCode !== 'US') {
        regionalPrice = await prisma.regionalPrice.findUnique({
            where: { plan_countryCode: { plan, countryCode: 'US' } },
            include: { currency: true }
        })
    }

    if (!regionalPrice) {
        throw new Error(`Pricing not configured for plan: ${plan}`)
    }

    const { currency } = regionalPrice
    let price = regionalPrice.price

    // 2 months free for annual billing
    if (billingCycle === 'annual') {
        price = price * 10
    }

    const taxRate = currency.taxRate || 0
    const provider = countryCode === 'IN' ? 'RAZORPAY' : 'STRIPE'

    // Assume 100 smallest units per base unit (cents, paise, pence, etc.)
    const amountSmallestUnit = Math.round(price * 100)
    const taxAmount = Math.round(amountSmallestUnit * (taxRate / 100))
    const totalWithTax = amountSmallestUnit + taxAmount

    return {
        plan,
        currencyCode: currency.code,
        symbol: currency.symbol,
        amount: price,
        amountSmallestUnit,
        taxRate,
        totalWithTax,
        provider
    }
}
