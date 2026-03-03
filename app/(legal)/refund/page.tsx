import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Refund Policy - EduPlay',
    description: 'Our policy regarding refunds and cancellations.',
}

export default function RefundPage() {
    return (
        <div className="prose prose-emerald dark:prose-invert max-w-none">
            <h1>Refund Policy</h1>
            <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>

            <h2>1. Free Trial</h2>
            <p>
                We offer a 30-day free trial on all new school accounts. You will not be charged until the trial period expires. You may cancel your account at any time during the trial period to avoid being charged.
            </p>

            <h2>2. Satisfaction Guarantee</h2>
            <p>
                If you are not satisfied with our service, you may request a refund within the first 14 days of your paid subscription. We will process your refund with no questions asked.
            </p>

            <h2>3. Cancellation</h2>
            <p>
                You may cancel your subscription at any time. Upon cancellation, your access to premium features will continue until the end of your current billing cycle. We do not provide prorated refunds for cancellations made mid-cycle.
            </p>

            <h2>4. Processing Time</h2>
            <p>
                Refunds are processed within 5-10 business days. The time it takes for the credit to appear on your statement depends on your credit card issuer.
            </p>

            <h2>5. Contact for Refunds</h2>
            <p>
                To request a refund or if you have any questions about this policy, please contact our billing department:
            </p>
            <p>
                Email: billing@eduplay.com
            </p>
        </div>
    )
}
