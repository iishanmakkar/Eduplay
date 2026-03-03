import Link from 'next/link'
import SimpleFooter from '@/components/SimpleFooter'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-white dark:bg-background flex flex-col">
            {/* Simple Navbar */}
            <nav className="sticky top-0 z-50 bg-white/90 dark:bg-background/90 backdrop-blur-lg border-b border-border">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="font-display text-2xl font-bold dark:text-white hover:opacity-80 transition">
                        Edu<span className="text-emerald-600 dark:text-emerald-400">Play</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link
                            href="/auth/signup"
                            className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow">
                <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                    <div className="prose prose-emerald dark:prose-invert max-w-none">
                        {children}
                    </div>
                </div>
            </main>

            <SimpleFooter />
        </div>
    )
}
