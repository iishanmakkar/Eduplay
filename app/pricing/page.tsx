'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import SimpleFooter from '@/components/SimpleFooter'

const plans = [
    {
        name: 'Starter',
        price: 3999,
        currency: '₹',
        features: ['Up to 2 classes', 'Up to 60 students', 'All 8 games', 'Basic analytics', 'Email support'],
        cta: 'Start Free Trial',
    },
    {
        name: 'School',
        price: 15999,
        currency: '₹',
        popular: true,
        features: ['Unlimited classes', 'Unlimited students', 'Advanced analytics', 'School admin panel', 'Priority support', 'LMS integration'],
        cta: 'Start Free Trial',
    },
    {
        name: 'District',
        price: 47999,
        currency: '₹',
        features: ['Up to 10 schools', 'District analytics', 'Custom branding', 'Dedicated manager', 'SLA guarantee'],
        cta: 'Contact Sales',
    },
]

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-background transition-colors duration-300">
            {/* Simple Navbar */}
            <nav className="sticky top-0 z-50 bg-white/90 dark:bg-background/90 backdrop-blur-lg border-b border-border">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="font-display text-2xl font-bold dark:text-white hover:opacity-80 transition">
                        Edu<span className="text-emerald-500">Play</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link href="/auth/signin" className="px-4 py-2 text-sm font-semibold text-ink dark:text-white hover:bg-surface dark:hover:bg-white/10 rounded-full transition">
                            Sign In
                        </Link>
                        <Link href="/auth/signup" className="px-5 py-2 text-sm font-semibold bg-fixed-dark text-white rounded-full hover:bg-fixed-medium transition shadow-md">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="py-24 px-6 bg-white dark:bg-background transition-colors duration-300">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="inline-block bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6">
                            ✦ Transparent Pricing
                        </span>
                        <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 dark:text-white tracking-tight">
                            Choose the perfect plan<br />for your <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">Classroom</span>
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
                            Join 1,200+ schools empowering the next generation with gamified learning. All plans include a 30-day free trial.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {plans.map((plan, i) => (
                            <div key={i} className={`relative bg-white dark:bg-slate-800 border-2 ${plan.popular ? 'border-emerald-500 shadow-2xl scale-105 z-10' : 'border-slate-100 dark:border-slate-700'} rounded-3xl p-10 transition-all duration-300`}>
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                                        MOST POPULAR
                                    </div>
                                )}
                                <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">{plan.name}</div>
                                <div className="font-display text-5xl font-black mb-1 dark:text-white flex items-baseline gap-1">
                                    <span className="text-2xl font-bold">{plan.currency || '$'}</span>
                                    {plan.price.toLocaleString('en-IN')}
                                </div>
                                <div className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-wider">per month</div>
                                <ul className="space-y-4 mb-10">
                                    {plan.features.map((feature, j) => (
                                        <li key={j} className="flex items-start gap-3">
                                            <span className="text-emerald-500 font-black mt-0.5">✓</span>
                                            <span className="text-slate-600 dark:text-slate-300 font-medium text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/auth/signup"
                                    className={`block w-full text-center py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${plan.popular
                                        ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                                        : 'bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                        }`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        ))}
                    </div>

                    {/* FAQ Quick Section */}
                    <div className="mt-32 max-w-3xl mx-auto">
                        <h2 className="text-3xl font-display font-bold text-center mb-12 dark:text-white">Frequently Asked Questions</h2>
                        <div className="space-y-8">
                            {[
                                { q: "Do I need a credit card to start?", a: "No! You can start your 30-day free trial without entering any billing information." },
                                { q: "Can I upgrade or downgrade later?", a: "Yes, you can change your plan at any time from your admin dashboard." },
                                { q: "Do you offer school-wide discounts?", a: "Yes, our School plan covers unlimited students and classes for a flat monthly fee." }
                            ].map((faq, k) => (
                                <div key={k} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">{faq.q}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <SimpleFooter />
        </div>
    )
}
