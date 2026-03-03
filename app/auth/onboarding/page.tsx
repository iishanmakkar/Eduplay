'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

type OnboardingStep = 'choose' | 'join-class' | 'payment' | 'complete' | 'coppa'

export default function OnboardingPage() {
    const { data: session, update } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [step, setStep] = useState<OnboardingStep>('coppa')
    const [inviteCode, setInviteCode] = useState('')
    const [loading, setLoading] = useState(false)

    // COPPA State
    const [dob, setDob] = useState('')
    const [parentEmail, setParentEmail] = useState('')

    // If already fully set up, redirect to dashboard
    useEffect(() => {
        // Only run routing logic once we know their consent status
        if (!session?.user || (session.user as any).consentStatus === 'PENDING') return;

        // If they already provided DOB and have no pending consent, go to choose
        if ((session.user as any).dob && step === 'coppa') {
            const urlStep = searchParams.get('step') as OnboardingStep
            setStep(urlStep || 'choose')
        }

        if (session?.user?.role === 'TEACHER' || session?.user?.role === 'SCHOOL' || session?.user?.role === 'OWNER') {
            router.push('/dashboard')
        }
        if (session?.user?.role === 'STUDENT' && (session.user as any).schoolId) {
            router.push('/dashboard/student')
        }
        if (session?.user?.role === 'INDEPENDENT') {
            router.push('/dashboard/independent')
        }
    }, [session, router, step, searchParams])

    const handleCoppaSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const birthDate = new Date(dob)
            const age = Math.floor((new Date().getTime() - birthDate.getTime()) / 31557600000)

            if (age < 13 && !parentEmail) {
                toast.error("Parent email required for users under 13.")
                setLoading(false)
                return;
            }

            const res = await fetch('/api/auth/coppa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dob, parentEmail: age < 13 ? parentEmail : null })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            await update({ dob, consentStatus: age < 13 ? 'PENDING' : 'NOT_REQUIRED', parentEmail })

            if (age < 13) {
                toast.success('Consent email sent to parent!')
                // Stay on coppa page, state handled by session
            } else {
                setStep('choose')
            }
        } catch (e: any) {
            toast.error(e.message || 'Error saving date of birth')
        } finally {
            setLoading(false)
        }
    }

    const handleChooseSchoolStudent = () => setStep('join-class')
    const handleChooseIndependent = () => setStep('payment')

    const handleJoinClass = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/invite-codes/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: inviteCode.trim().toUpperCase() }),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || 'Invalid invite code')
                return
            }

            // Update session with new schoolId and teacherId
            await update({
                schoolId: data.schoolId,
                teacherId: data.teacherId,
                role: 'STUDENT',
            })

            toast.success('Successfully joined class!')
            router.push('/dashboard/student')
        } catch {
            toast.error('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleIndependentPayment = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/subscriptions/independent/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })
            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || 'Failed to create subscription')
                return
            }

            // Redirect to Razorpay checkout
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl
            } else {
                toast.error('Payment setup failed')
            }
        } catch {
            toast.error('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-12 transition-colors">
            <div className="w-full max-w-lg">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-8 transition-colors">
                    <div className="text-center mb-8">
                        <div className="font-display text-3xl font-bold mb-2 text-slate-900 dark:text-white">
                            Edu<span className="text-emerald-500">Play</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Welcome, {session?.user?.name?.split(' ')[0] || 'there'}! Let&apos;s get you set up.
                        </p>
                    </div>

                    {/* Step: Choose path */}
                    {step === 'choose' && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-6">
                                How will you use EduPlay?
                            </h2>

                            <button
                                onClick={handleChooseSchoolStudent}
                                className="w-full p-5 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl text-left transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl">🏫</div>
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                            School Student
                                        </div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            I have a class invite code from my teacher
                                        </div>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={handleChooseIndependent}
                                className="w-full p-5 border-2 border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 rounded-xl text-left transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl">🚀</div>
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                            Individual Learner
                                        </div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            I want to learn independently — $5/month
                                        </div>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                                className="w-full text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 py-2 transition"
                            >
                                Sign out
                            </button>
                        </div>
                    )}

                    {/* Step: Join class with invite code */}
                    {step === 'join-class' && (
                        <div>
                            <button
                                onClick={() => setStep('choose')}
                                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-6 flex items-center gap-1"
                            >
                                ← Back
                            </button>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                Enter your class invite code
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Your teacher should have shared a code with you. It looks like <code className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1 rounded">ABC12345</code>.
                            </p>

                            <form onSubmit={handleJoinClass} className="space-y-4">
                                <input
                                    type="text"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    className="w-full px-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors text-center text-2xl tracking-[0.3em] font-mono uppercase"
                                    placeholder="ABC12345"
                                    maxLength={8}
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={loading || inviteCode.length < 6}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 shadow-lg"
                                >
                                    {loading ? 'Joining class...' : 'Join Class →'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Step: Payment for independent */}
                    {step === 'payment' && (
                        <div>
                            <button
                                onClick={() => setStep('choose')}
                                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-6 flex items-center gap-1"
                            >
                                ← Back
                            </button>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                Individual Plan — $5/month
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Get full access to all games, brain boost challenges, leaderboards, and XP tracking.
                            </p>

                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-6 space-y-2">
                                {['All 25+ educational games', 'Brain Boost challenges', 'XP & level progression', 'Weekly leaderboards', 'Daily challenges', 'Progress analytics'].map(feature => (
                                    <div key={feature} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                        <span className="text-emerald-500">✓</span>
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleIndependentPayment}
                                disabled={loading}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 shadow-lg"
                            >
                                {loading ? 'Setting up payment...' : 'Subscribe for $5/month →'}
                            </button>

                            <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-3">
                                Secure payment via Razorpay. Cancel anytime.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
