'use client'

import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function SignUpPage() {
    const handleGoogleSignIn = () => {
        signIn('google', { callbackUrl: '/auth/onboarding' })
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-12 transition-colors">
            <div className="absolute top-6 left-6">
                <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">
                    ← Back to home
                </Link>
            </div>

            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-8 transition-colors">
                    <div className="text-center mb-8">
                        <div className="font-display text-3xl font-bold mb-2 text-slate-900 dark:text-white">
                            Edu<span className="text-emerald-500">Play</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Create your student account</p>
                    </div>

                    {/* Who can sign up notice */}
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Who can sign up here?</p>
                        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                            <li>✅ <strong>School Students</strong> — join your class with an invite code</li>
                            <li>✅ <strong>Individual Learners</strong> — subscribe for $5/month</li>
                        </ul>
                    </div>

                    {/* Google Sign-Up */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="w-full bg-white dark:bg-white text-slate-700 hover:bg-gray-50 border border-slate-200 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 mb-4"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.23-.19-.61z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-6">
                        After signing in, you&apos;ll choose your plan and complete setup.
                    </p>

                    {/* Teacher notice */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">👩‍🏫 Are you a teacher?</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                            Teachers are created by their school admin. You should have received an invite link via email. Check your inbox or contact your school administrator.
                        </p>
                    </div>

                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                        Already have an account?{' '}
                        <Link href="/auth/signin" className="text-emerald-500 font-semibold hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
