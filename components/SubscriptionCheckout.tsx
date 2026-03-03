'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface SubscriptionCheckoutProps {
    isOpen: boolean
    onClose: () => void
    selectedPlan: 'STARTER' | 'SCHOOL' | 'DISTRICT'
    currentPlan?: string
}

const PLAN_DETAILS = {
    STARTER: {
        name: 'Starter',
        price: 999,
        priceAnnual: 9990, // 20% discount
        students: 100,
        teachers: 5,
        features: ['100 Students', '5 Teachers', 'All Games', 'Basic Analytics', 'Email Support'],
    },
    SCHOOL: {
        name: 'School',
        price: 4999,
        priceAnnual: 49990,
        students: 500,
        teachers: 25,
        features: ['500 Students', '25 Teachers', 'All Games', 'Advanced Analytics', 'Priority Support', 'Custom Branding'],
    },
    DISTRICT: {
        name: 'District',
        price: 19999,
        priceAnnual: 199990,
        students: -1,
        teachers: -1,
        features: ['Unlimited Students', 'Unlimited Teachers', 'All Games', 'Enterprise Analytics', 'Dedicated Support', 'White Label', 'Multi-School Management'],
    },
}

export default function SubscriptionCheckout({
    isOpen,
    onClose,
    selectedPlan,
    currentPlan,
}: SubscriptionCheckoutProps) {
    const router = useRouter()
    const [isAnnual, setIsAnnual] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    const plan = PLAN_DETAILS[selectedPlan]
    const price = isAnnual ? plan.priceAnnual : plan.price
    const savings = isAnnual ? plan.price * 12 - plan.priceAnnual : 0

    const handleCheckout = async () => {
        setIsProcessing(true)

        try {
            // 1. Create order on backend
            const res = await fetch('/api/subscriptions/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: selectedPlan,
                    billingCycle: isAnnual ? 'annual' : 'monthly',
                }),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to create checkout')
            }

            const { orderId, amount, currency, key } = await res.json()

            // 2. Load Razorpay script
            const script = document.createElement('script')
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.async = true
            document.body.appendChild(script)

            script.onload = () => {
                // 3. Open Razorpay checkout
                const options = {
                    key,
                    amount,
                    currency,
                    name: 'EduPlay Pro',
                    description: `${plan.name} Plan - ${isAnnual ? 'Annual' : 'Monthly'}`,
                    order_id: orderId,
                    handler: async function (response: any) {
                        // 4. Verify payment on backend
                        try {
                            const verifyRes = await fetch('/api/subscriptions/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_signature: response.razorpay_signature,
                                }),
                            })

                            if (!verifyRes.ok) {
                                throw new Error('Payment verification failed')
                            }

                            toast.success('Payment successful! Your subscription is now active.')
                            onClose()
                            router.refresh()
                        } catch (error) {
                            console.error('Verification error:', error)
                            toast.error('Payment verification failed. Please contact support.')
                        }
                    },
                    prefill: {
                        name: '',
                        email: '',
                    },
                    theme: {
                        color: '#10b981',
                    },
                    modal: {
                        ondismiss: function () {
                            setIsProcessing(false)
                        },
                    },
                }

                // @ts-ignore
                const razorpay = new window.Razorpay(options)
                razorpay.open()
            }

            script.onerror = () => {
                toast.error('Failed to load payment gateway')
                setIsProcessing(false)
            }
        } catch (error: any) {
            console.error('Checkout error:', error)
            toast.error(error.message || 'Failed to initiate checkout')
            setIsProcessing(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-background rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border dark:border-border">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-background border-b border-gray-200 dark:border-border px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Subscribe to {plan.name}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Billing Cycle Toggle */}
                    <div className="bg-gray-50 dark:bg-ink-2 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <button
                                onClick={() => setIsAnnual(false)}
                                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${!isAnnual
                                    ? 'bg-emerald text-white'
                                    : 'bg-white dark:bg-fixed-dark text-gray-600 dark:text-mist hover:bg-gray-100 dark:hover:bg-fixed-medium'
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setIsAnnual(true)}
                                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ml-2 ${isAnnual
                                    ? 'bg-emerald text-white'
                                    : 'bg-white dark:bg-ink text-gray-600 dark:text-mist hover:bg-gray-100 dark:hover:bg-ink-3'
                                    }`}
                            >
                                Annual
                                <span className="ml-1 text-xs">Save 20%</span>
                            </button>
                        </div>
                        {isAnnual && savings > 0 && (
                            <p className="text-sm text-emerald font-semibold text-center">
                                💰 Save ${savings.toLocaleString('en-IN')} per year!
                            </p>
                        )}
                    </div>

                    {/* Price Display */}
                    <div className="text-center mb-6">
                        <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                            ${price.toLocaleString('en-IN')}
                        </div>
                        <div className="text-gray-600 dark:text-mist">
                            per {isAnnual ? 'year' : 'month'}
                        </div>
                        {isAnnual && (
                            <div className="text-sm text-gray-500 dark:text-mist/70 mt-1">
                                ${Math.round(price / 12).toLocaleString('en-IN')}/month when billed annually
                            </div>
                        )}
                    </div>

                    {/* Features */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                            What&apos;s included:
                        </h3>
                        <ul className="space-y-2">
                            {plan.features.map((feature, index) => (
                                <li key={index} className="flex items-start">
                                    <span className="text-emerald mr-2">✓</span>
                                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Current Plan Notice */}
                    {currentPlan && currentPlan !== selectedPlan && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Note:</strong> You&apos;re currently on the {currentPlan} plan.
                                {currentPlan && selectedPlan > currentPlan
                                    ? ' Upgrading will give you immediate access to new features.'
                                    : ' Downgrading will take effect at the end of your current billing period.'}
                            </p>
                        </div>
                    )}

                    {/* Checkout Button */}
                    <button
                        onClick={handleCheckout}
                        disabled={isProcessing}
                        className="w-full py-4 bg-emerald text-white font-bold rounded-xl hover:bg-emerald-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Processing...
                            </span>
                        ) : (
                            `Subscribe to ${plan.name} →`
                        )}
                    </button>

                    {/* Trust Badges */}
                    <div className="mt-6 text-center text-sm text-gray-500 dark:text-mist">
                        <p>🔒 Secure payment powered by Razorpay</p>
                        <p className="mt-1">Cancel anytime. No hidden fees.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
