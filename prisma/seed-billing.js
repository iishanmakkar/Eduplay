const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Currencies and Regional Prices...')

    // 1. Currencies
    const inr = await prisma.currency.upsert({
        where: { code: 'INR' },
        update: {},
        create: {
            code: 'INR',
            symbol: '₹',
            exchangeRate: 1.0,
            taxRate: 18.0, // 18% GST in India
            locale: 'en-IN'
        }
    })

    const usd = await prisma.currency.upsert({
        where: { code: 'USD' },
        update: {},
        create: {
            code: 'USD',
            symbol: '$',
            exchangeRate: 83.0, // Roughly 83 INR to 1 USD
            taxRate: 0.0, // Varies by state, default 0 for simplicity
            locale: 'en-US'
        }
    })

    // 2. Regional Prices
    const plans = ['STARTER', 'SCHOOL', 'DISTRICT', 'INDEPENDENT']

    // Base Prices (Monthly)
    // STARTER: ₹3999 ($49)
    // SCHOOL: ₹15999 ($199)
    // DISTRICT: ₹47999 ($599)
    const pricesIN = { STARTER: 3999, SCHOOL: 15999, DISTRICT: 47999 }
    const pricesUS = { STARTER: 49, SCHOOL: 199, DISTRICT: 599 }

    for (const plan of ['STARTER', 'SCHOOL', 'DISTRICT']) {
        await prisma.regionalPrice.upsert({
            where: { plan_countryCode: { plan, countryCode: 'IN' } },
            update: { price: pricesIN[plan] },
            create: {
                plan,
                countryCode: 'IN',
                currencyCode: 'INR',
                price: pricesIN[plan]
            }
        })

        await prisma.regionalPrice.upsert({
            where: { plan_countryCode: { plan, countryCode: 'US' } },
            update: { price: pricesUS[plan] },
            create: {
                plan,
                countryCode: 'US', // Fallback global
                currencyCode: 'USD',
                price: pricesUS[plan]
            }
        })
    }

    console.log('Finished seeding billing data.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
