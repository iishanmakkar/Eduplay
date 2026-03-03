'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function SignInPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [twoFactorCode, setTwoFactorCode] = useState('')
    const [is2FAMode, setIs2FAMode] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                code: is2FAMode ? twoFactorCode : undefined,
                redirect: false,
            })

            if (result?.error) {
                if (result.error === '2FA_REQUIRED') {
                    setIs2FAMode(true)
                    toast('Two-factor authentication required', { icon: '🔐' })
                } else if (result.error === 'Invalid 2FA code') {
                    toast.error('Invalid verification code')
                } else {
                    toast.error('Invalid email or password')
                }
            } else {
                toast.success('Welcome back!')
                router.push('/dashboard')
                router.refresh()
            }
        } catch {
            toast.error('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

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
                        <p className="text-sm text-slate-500 dark:text-slate-400">Sign in to your account</p>
                    </div>

                    {/* Google Sign-In — Students Only */}
                    <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-3 text-center uppercase tracking-wider">
                            👦 Students — Sign in with Google
                        </p>
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            className="w-full bg-white dark:bg-white text-slate-700 hover:bg-gray-50 border border-slate-200 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.23-.19-.61z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign in with Google
                        </button>
                        <p className="text-xs text-emerald-600 dark:text-emerald-500 text-center mt-2">
                            School students & individual learners only
                        </p>
                    </div>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
                                Teachers &amp; Schools — use email
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {is2FAMode ? (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Two-Factor Authentication Code
                                </label>
                                <input
                                    type="text"
                                    value={twoFactorCode}
                                    onChange={(e) => setTwoFactorCode(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors text-center text-2xl tracking-widest"
                                    placeholder="000000"
                                    required
                                    autoFocus
                                    maxLength={6}
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                                    Enter the code from your authenticator app
                                </p>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Email address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                                        placeholder="teacher@school.edu"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 shadow-lg"
                        >
                            {loading ? 'Signing in...' : is2FAMode ? 'Verify & Sign In' : 'Sign In →'}
                        </button>

                        {is2FAMode && (
                            <button
                                type="button"
                                onClick={() => setIs2FAMode(false)}
                                className="w-full text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 py-2"
                            >
                                Cancel
                            </button>
                        )}
                    </form>

                    {/* Info box for teachers */}
                    <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
                            🔐 <strong>Teachers:</strong> Use your school-provided email &amp; password. Google login is not available for teachers.
                        </p>
                    </div>

                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                        New student?{' '}
                        <Link href="/auth/signup" className="text-emerald-500 font-semibold hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
