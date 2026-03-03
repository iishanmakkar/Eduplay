import Link from 'next/link'

export default function Forbidden() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-4">
            <div className="text-6xl mb-4">403</div>
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md text-center">
                You do not have permission to access this resource. Please contact your administrator if you believe this is an error.
            </p>
            <Link
                href="/dashboard"
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
            >
                Return to Dashboard
            </Link>
        </div>
    )
}
