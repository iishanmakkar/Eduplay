import Link from 'next/link'
import { headers } from 'next/headers'

export default async function NotFound() {
    const headersList = headers()
    // const domain = headersList.get('host')

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-6 transition-colors duration-300">
            <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl shadow-2xl max-w-md w-full text-center border border-slate-200 dark:border-slate-700">
                <div className="text-8xl font-display font-black text-emerald-500 mb-6 drop-shadow-sm">404</div>
                <h2 className="text-3xl font-display font-bold mb-4">Page Not Found</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-medium">
                    Oops! The page you are looking for does not exist or has been moved to a new location.
                </p>
                <Link
                    href="/"
                    className="block w-full px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                    Return to Home
                </Link>
            </div>
        </div>
    )
}
