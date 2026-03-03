import Razorpay from 'razorpay'

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be defined for payments')
}

export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_dummy',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_dummy',
})

export const PLANS = {
    STARTER: {
        name: 'Starter',
        price: 3999, // ₹3,999/month (approx $49)
        priceInPaise: 399900, // Razorpay uses paise
        planId: process.env.RAZORPAY_STARTER_PLAN_ID!,
        features: [
            'Up to 2 classes',
            'Up to 60 students',
            'All 8 games',
            'Basic analytics',
            'Assignment system',
            'Email support',
        ],
        limits: {
            classes: 2,
            students: 60,
        },
    },
    SCHOOL: {
        name: 'School',
        price: 15999, // ₹15,999/month (approx $199)
        priceInPaise: 1599900,
        planId: process.env.RAZORPAY_SCHOOL_PLAN_ID!,
        features: [
            'Unlimited classes',
            'Unlimited students',
            'All games + new releases',
            'Advanced analytics & reports',
            'School admin panel',
            'Priority support',
            'LMS integration',
        ],
        limits: {
            classes: Infinity,
            students: Infinity,
        },
    },
    DISTRICT: {
        name: 'District',
        price: 47999, // ₹47,999/month (approx $599)
        priceInPaise: 4799900,
        planId: process.env.RAZORPAY_DISTRICT_PLAN_ID!,
        features: [
            'Up to 10 schools',
            'Multi-school management',
            'District-wide analytics',
            'Custom branding',
            'Dedicated account manager',
            'SLA guarantee',
            'Custom game creation',
        ],
        limits: {
            classes: Infinity,
            students: Infinity,
            schools: 10,
        },
    },
}

// Helper to verify Razorpay webhook signature
export function verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string
): boolean {
    const crypto = require('crypto')
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex')
    return expectedSignature === signature
}
