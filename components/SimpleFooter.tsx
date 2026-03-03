import Link from 'next/link'

export default function SimpleFooter() {
    return (
        <footer className="bg-white dark:bg-slate-900 py-20 px-6 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
                    <div className="col-span-2 lg:col-span-2">
                        <div className="font-display text-3xl font-black text-slate-900 dark:text-white mb-6">
                            Edu<span className="text-emerald-500">Play</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-base mb-8 max-w-sm font-medium leading-relaxed">
                            The world&apos;s most engaging gamified learning platform for K–12 students. Empowering teachers and inspiring young minds through epic play.
                        </p>
                        <div className="flex items-center gap-4">
                            {['Twitter', 'Discord', 'LinkedIn'].map((social) => (
                                <div key={social} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-500 cursor-pointer transition-colors shadow-sm">
                                    <span className="text-[10px] font-black uppercase tracking-tighter">{social[0]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Platform</h4>
                        <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                            <li><Link href="/#features" className="hover:text-emerald-500 transition-colors">Features</Link></li>
                            <li><Link href="/#pricing" className="hover:text-emerald-500 transition-colors">Pricing</Link></li>
                            <li><Link href="/auth/signin" className="hover:text-emerald-500 transition-colors">Login</Link></li>
                            <li><Link href="/auth/signup" className="hover:text-emerald-500 transition-colors">Start Trial</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Company</h4>
                        <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                            <li><Link href="/about" className="hover:text-emerald-500 transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-emerald-500 transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Legal</h4>
                        <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                            <li><Link href="/privacy" className="hover:text-emerald-500 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-emerald-500 transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-10 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
                        © {new Date().getFullYear()} EduPlay Technologies Inc.
                    </p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
                        Made with <span className="text-red-500 animate-pulse">❤️</span> for future leaders
                    </p>
                </div>
            </div>
        </footer>
    )
}
