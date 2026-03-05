'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

const ERROR_MESSAGES: Record<string, { title: string; message: string; icon: string }> = {
    OAuthSignin: {
        icon: '🔐',
        title: 'Google Sign-In Failed',
        message: 'There was a problem connecting to Google. Please try again or use email login.',
    },
    OAuthCallback: {
        icon: '🔐',
        title: 'Authentication Callback Error',
        message: 'Something went wrong after Google redirected back. Please try again.',
    },
    OAuthCreateAccount: {
        icon: '📧',
        title: 'Account Creation Failed',
        message: 'We couldn\'t create your account. The email may already be in use with a different sign-in method.',
    },
    EmailCreateAccount: {
        icon: '📧',
        title: 'Email Sign-Up Error',
        message: 'Could not create an account with that email address. Please try again.',
    },
    Callback: {
        icon: '⚠️',
        title: 'Sign-In Error',
        message: 'An error occurred during sign-in. Please try again.',
    },
    OAuthAccountNotLinked: {
        icon: '🔗',
        title: 'Account Already Exists',
        message: 'This email is already registered with a different sign-in method. Please use your original login method.',
    },
    EmailSignin: {
        icon: '📬',
        title: 'Email Sign-In Error',
        message: 'The sign-in link is invalid or has expired. Please request a new one.',
    },
    CredentialsSignin: {
        icon: '🔑',
        title: 'Invalid Credentials',
        message: 'The email or password you entered is incorrect. Please double-check and try again.',
    },
    TeacherGoogleBlocked: {
        icon: '🏫',
        title: 'Teacher Login Required',
        message: 'Teacher and school accounts must sign in with an email and password, not Google. Please use the email login form.',
    },
    SchoolSuspended: {
        icon: '⏸️',
        title: 'Account Suspended',
        message: 'Your school\'s subscription has expired or been suspended. Please contact your school administrator.',
    },
    AccessDenied: {
        icon: '🚫',
        title: 'Access Denied',
        message: 'You don\'t have permission to access this resource.',
    },
    Default: {
        icon: '⚠️',
        title: 'Authentication Error',
        message: 'An unexpected error occurred. Please try signing in again.',
    },
}

function ErrorContent() {
    const searchParams = useSearchParams()
    const errorCode = searchParams.get('error') || 'Default'
    const errorInfo = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.Default

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                    {/* Icon */}
                    <div className="text-6xl mb-6">{errorInfo.icon}</div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                        {errorInfo.title}
                    </h1>

                    {/* Message */}
                    <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                        {errorInfo.message}
                    </p>

                    {/* Error code badge */}
                    <div className="inline-block bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-mono px-3 py-1 rounded-full border border-red-200 dark:border-red-900 mb-8">
                        Error code: {errorCode}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <Link
                            href="/auth/signin"
                            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
                        >
                            Try Again
                        </Link>
                        <Link
                            href="/"
                            className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all active:scale-95"
                        >
                            Return to Home
                        </Link>
                    </div>
                </div>

                {/* Support line */}
                <p className="text-center text-sm text-slate-500 dark:text-slate-500 mt-6">
                    Need help?{' '}
                    <a
                        href="mailto:support@eduplay.ai"
                        className="text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                        Contact support
                    </a>
                </p>
            </div>
        </div>
    )
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="animate-spin text-4xl">⟳</div>
            </div>
        }>
            <ErrorContent />
        </Suspense>
    )
}
