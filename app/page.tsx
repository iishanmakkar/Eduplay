import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import SimpleFooter from '@/components/SimpleFooter'

const STATS = [
    { value: '1,200+', label: 'Schools Trust EduPlay', icon: '🏫' },
    { value: '84,000+', label: 'Active Students', icon: '👩‍🎓' },
    { value: '96%', label: 'Teacher Satisfaction', icon: '⭐' },
    { value: '3.2×', label: 'Faster Retention', icon: '🧠' },
]

const FEATURES = [
    {
        icon: '🎮',
        title: '25 Curriculum-Aligned Games',
        desc: 'Math, English, Science, Geography — all mapped to CBSE, ICSE, and CCSS national curricula.',
        gradient: 'from-emerald-500/20 to-teal-500/10',
        border: 'border-emerald-500/20',
        iconBg: 'bg-emerald-500/10',
    },
    {
        icon: '🧠',
        title: 'Bayesian AI Mastery Engine',
        desc: 'Our BKT + IRT adaptive engine tracks exactly what each student knows, moment by moment.',
        gradient: 'from-violet-500/20 to-purple-500/10',
        border: 'border-violet-500/20',
        iconBg: 'bg-violet-500/10',
    },
    {
        icon: '📊',
        title: 'Real-Time Analytics',
        desc: "Track every student's P(L) mastery score and generate FERPA-compliant reports in one click.",
        gradient: 'from-sky-500/20 to-blue-500/10',
        border: 'border-sky-500/20',
        iconBg: 'bg-sky-500/10',
    },
    {
        icon: '🏆',
        title: 'Grade-Band Leaderboards',
        desc: 'Keep students motivated with XP points, badges, and grade-insulated competitive rankings.',
        gradient: 'from-amber-500/20 to-orange-500/10',
        border: 'border-amber-500/20',
        iconBg: 'bg-amber-500/10',
    },
    {
        icon: '👨‍👩‍👧',
        title: 'Full Multi-Role Platform',
        desc: 'Dedicated portals for students, teachers, school admins, and district principals.',
        gradient: 'from-rose-500/20 to-pink-500/10',
        border: 'border-rose-500/20',
        iconBg: 'bg-rose-500/10',
    },
    {
        icon: '🔒',
        title: 'FERPA, COPPA & GDPR Ready',
        desc: 'Zero ads. Zero data selling. Full student data sovereignty with Right to be Forgotten API.',
        gradient: 'from-indigo-500/20 to-blue-500/10',
        border: 'border-indigo-500/20',
        iconBg: 'bg-indigo-500/10',
    },
]

const PLANS = [
    {
        name: 'Starter',
        rupee: '₹5,000',
        period: '/mo',
        badge: null,
        highlight: false,
        features: ['Up to 300 students', 'All 25 games', 'BKT analytics', 'Email support', '30-day free trial'],
        cta: 'Start Free Trial',
        href: '/auth/signup',
    },
    {
        name: 'School',
        rupee: '₹15,000',
        period: '/mo',
        badge: 'Most Popular',
        highlight: true,
        features: ['Up to 600 students', 'Unlimited classes', 'Advanced AI analytics', 'School admin panel', 'Priority support', 'LMS integration'],
        cta: 'Start Free Trial',
        href: '/auth/signup',
    },
    {
        name: 'District',
        rupee: '₹1,00,000',
        period: '/mo',
        badge: 'Enterprise',
        highlight: false,
        features: ['Up to 5,000 students', 'District analytics', 'Custom branding', 'Dedicated success manager', 'SLA guarantee', 'FERPA export API'],
        cta: 'Contact Sales',
        href: '/contact',
    },
]

export default function HomePage() {
    return (
        <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden">

            {/* ── Nav ─────────────────────────────────────────────── */}
            <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#080c14]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="font-display text-2xl font-black tracking-tight">
                        Edu<span className="text-emerald-400">Play</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/50">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#how" className="hover:text-white transition-colors">How It Works</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link href="/auth/signin" className="px-4 py-2 text-sm font-semibold text-white/70 hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link href="/auth/signup" className="px-5 py-2.5 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white rounded-full transition-all shadow-lg shadow-emerald-500/25 active:scale-95">
                            Start Free Trial
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero ────────────────────────────────────────────── */}
            <section className="relative min-h-[90vh] flex items-center justify-center px-6 py-24 overflow-hidden">

                {/* Animated gradient orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/15 rounded-full blur-[100px] animate-pulse-slow-delay pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[160px] pointer-events-none" />

                {/* Grid overlay */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] pointer-events-none" />

                <div className="max-w-5xl mx-auto text-center relative z-10">

                    {/* Eyebrow badge */}
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-bold mb-10 shadow-lg shadow-emerald-500/10">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        Live in 1,200+ schools across India
                    </div>

                    {/* Headline */}
                    <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight mb-8">
                        Every Lesson,{' '}
                        <span className="relative inline-block">
                            <span className="bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400 bg-clip-text text-transparent">
                                An Adventure
                            </span>
                        </span>
                    </h1>

                    {/* Sub */}
                    <p className="text-xl md:text-2xl text-white/50 max-w-2xl mx-auto mb-14 leading-relaxed font-medium">
                        EduPlay turns math, science, English, and geography into competitive multiplayer games — powered by a Bayesian AI that adapts to each student in real time.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Link
                            href="/auth/signup"
                            className="group px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-lg transition-all shadow-2xl shadow-emerald-500/30 active:scale-95 flex items-center gap-3"
                        >
                            🚀 Start Free 30-Day Trial
                            <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
                        </Link>
                        <Link
                            href="/auth/signin?demo=teacher"
                            className="px-10 py-5 border border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-lg transition-all active:scale-95 backdrop-blur-sm"
                        >
                            👀 See Live Demo
                        </Link>
                    </div>

                    {/* Trust chips */}
                    <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-white/30 uppercase tracking-widest">
                        <span className="flex items-center gap-2"><span className="text-emerald-500">✓</span> No credit card required</span>
                        <span className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Set up in 5 minutes</span>
                        <span className="flex items-center gap-2"><span className="text-emerald-500">✓</span> FERPA & COPPA compliant</span>
                    </div>
                </div>
            </section>

            {/* ── Stats ───────────────────────────────────────────── */}
            <section className="border-y border-white/5 bg-white/[0.02] py-16 px-6">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                    {STATS.map((s, i) => (
                        <div key={i} className="text-center group">
                            <div className="text-3xl mb-3">{s.icon}</div>
                            <div className="font-display text-4xl md:text-5xl font-black text-white mb-2 group-hover:text-emerald-400 transition-colors">
                                {s.value}
                            </div>
                            <div className="text-xs font-bold text-white/35 uppercase tracking-widest">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Features ────────────────────────────────────────── */}
            <section id="features" className="py-28 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="inline-block px-5 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50 text-xs font-black uppercase tracking-widest mb-6">
                            ✦ Platform Features
                        </span>
                        <h2 className="font-display text-4xl md:text-6xl font-black mb-6 tracking-tight">
                            Built for schools,{' '}
                            <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                                loved by students
                            </span>
                        </h2>
                        <p className="text-xl text-white/40 max-w-2xl mx-auto font-medium">
                            A complete adaptive learning platform — from classroom minigames to school-wide AI mastery reports.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FEATURES.map((f, i) => (
                            <div
                                key={i}
                                className={`group relative rounded-3xl p-8 border ${f.border} bg-gradient-to-br ${f.gradient} hover:scale-[1.02] transition-all duration-300 cursor-default overflow-hidden`}
                            >
                                {/* Shine on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />

                                <div className={`w-14 h-14 ${f.iconBg} rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}>
                                    {f.icon}
                                </div>
                                <h3 className="font-display text-lg font-bold mb-3 text-white">{f.title}</h3>
                                <p className="text-white/50 font-medium leading-relaxed text-sm">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How It Works ─────────────────────────────────────── */}
            <section id="how" className="py-28 px-6 border-t border-white/5 bg-white/[0.02]">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="inline-block px-5 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50 text-xs font-black uppercase tracking-widest mb-6">
                        ✦ How It Works
                    </span>
                    <h2 className="font-display text-4xl md:text-6xl font-black mb-20 tracking-tight">
                        Ready in{' '}
                        <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">3 steps</span>
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8 text-left">
                        {[
                            { step: '01', title: 'Create Your School', desc: 'Sign up and invite your teachers. Set up classes, assign grades, and configure your curriculum standard in minutes.' },
                            { step: '02', title: 'Students Join & Play', desc: 'Students scan a QR code or enter a class code. They immediately start playing games — no app download required.' },
                            { step: '03', title: 'Watch Mastery Grow', desc: "Our BKT AI tracks every student's skill mastery. You get live P(L) dashboards and weekly PDF reports." },
                        ].map((step, i) => (
                            <div key={i} className="relative group">
                                <div className="text-7xl font-black text-white/5 group-hover:text-white/10 transition-colors font-display absolute -top-4 -left-2 select-none">
                                    {step.step}
                                </div>
                                <div className="pt-8">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm mb-5">
                                        {parseInt(step.step)}
                                    </div>
                                    <h3 className="font-display text-xl font-bold text-white mb-3">{step.title}</h3>
                                    <p className="text-white/40 font-medium leading-relaxed text-sm">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── AI Moat Section ──────────────────────────────────── */}
            <section className="py-28 px-6 border-t border-white/5 overflow-hidden">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="inline-block px-5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-black uppercase tracking-widest mb-6">
                                ✦ The AI Advantage
                            </span>
                            <h2 className="font-display text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight">
                                The only EdTech with a{' '}
                                <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                                    real AI moat
                                </span>
                            </h2>
                            <p className="text-white/40 mb-8 leading-relaxed font-medium">
                                Our <strong className="text-white/70">Bayesian Knowledge Tracing (BKT)</strong> engine models each student&apos;s hidden knowledge state after every question — not just right or wrong. Competitors use static quizzes. We use math.
                            </p>
                            <div className="space-y-4">
                                {[
                                    { label: 'BKT Mastery Tracking', who: 'EduPlay ✅ | Kahoot ❌ | Khan Academy Partial' },
                                    { label: 'IRT Adaptive Difficulty (3PL)', who: 'EduPlay ✅ | All competitors ❌' },
                                    { label: 'Ebbinghaus Forgetting Curves', who: 'EduPlay ✅ | All competitors ❌' },
                                    { label: 'SM-2 Spaced Repetition', who: 'EduPlay + BKT ✅ | Quizlet basic SM-2 only' },
                                ].map((row, i) => (
                                    <div key={i} className="flex flex-col gap-1 p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                                        <div className="font-bold text-white text-sm">{row.label}</div>
                                        <div className="text-white/35 text-xs font-medium">{row.who}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mock BKT chart */}
                        <div className="relative">
                            <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur p-8 shadow-2xl">
                                <div className="text-xs font-black text-white/30 uppercase tracking-widest mb-6">Student Mastery — P(L) over 12 months</div>
                                <div className="space-y-4">
                                    {[
                                        { skill: 'Addition', pl: 94, color: 'bg-emerald-500' },
                                        { skill: 'Multiplication', pl: 78, color: 'bg-sky-500' },
                                        { skill: 'Fractions', pl: 62, color: 'bg-violet-500' },
                                        { skill: 'Geometry', pl: 45, color: 'bg-amber-500' },
                                        { skill: 'Algebra', pl: 31, color: 'bg-rose-500' },
                                    ].map((row, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="w-24 text-xs font-bold text-white/50 shrink-0">{row.skill}</div>
                                            <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full ${row.color} rounded-full`}
                                                    style={{ width: `${row.pl}%` }}
                                                />
                                            </div>
                                            <div className="w-10 text-right text-xs font-black text-white/60">{row.pl}%</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-white/30 font-bold">
                                    <span>P(L) = Probability of Knowing the Skill</span>
                                    <span className="text-emerald-400">BKT v2.0</span>
                                </div>
                            </div>
                            {/* Floating decoration */}
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />
                            <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Pricing ──────────────────────────────────────────── */}
            <section id="pricing" className="py-28 px-6 border-t border-white/5 bg-white/[0.02]">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="inline-block px-5 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50 text-xs font-black uppercase tracking-widest mb-6">
                            ✦ Pricing
                        </span>
                        <h2 className="font-display text-4xl md:text-6xl font-black mb-6 tracking-tight">
                            Simple, transparent pricing
                        </h2>
                        <p className="text-xl text-white/40 font-medium">
                            All plans include a 30-day free trial. No credit card required.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
                        {PLANS.map((plan, i) => (
                            <div
                                key={i}
                                className={`relative rounded-3xl p-10 border transition-all duration-300 ${plan.highlight
                                    ? 'border-emerald-500/50 bg-emerald-500/5 shadow-2xl shadow-emerald-500/10 scale-105 z-10'
                                    : 'border-white/8 bg-white/[0.03] hover:border-white/15'
                                    }`}
                            >
                                {plan.badge && (
                                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg ${plan.highlight ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60 border border-white/10'
                                        }`}>
                                        {plan.badge}
                                    </div>
                                )}
                                <div className="text-xs font-black text-white/30 uppercase tracking-widest mb-4">{plan.name}</div>
                                <div className="font-display text-5xl font-black text-white mb-1 flex items-baseline gap-1">
                                    {plan.rupee}
                                </div>
                                <div className="text-sm font-bold text-white/30 mb-8">{plan.period} · billed annually</div>

                                <ul className="space-y-3 mb-10">
                                    {plan.features.map((feat, j) => (
                                        <li key={j} className="flex items-center gap-3 text-sm font-medium text-white/60">
                                            <span className="text-emerald-400 font-black shrink-0">✓</span>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href={plan.href}
                                    className={`block w-full text-center py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 ${plan.highlight
                                        ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25'
                                        : 'border border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10 text-white'
                                        }`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Final CTA ────────────────────────────────────────── */}
            <section className="py-28 px-6 border-t border-white/5 relative overflow-hidden text-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[100px] pointer-events-none" />
                <div className="max-w-3xl mx-auto relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-8">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Join 84,000+ students learning smarter
                    </div>
                    <h2 className="font-display text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight">
                        Ready to transform{' '}
                        <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                            your classroom?
                        </span>
                    </h2>
                    <p className="text-xl text-white/40 mb-12 font-medium">
                        Start your free 30-day trial today. No setup fees, no credit card.
                    </p>
                    <Link
                        href="/auth/signup"
                        className="inline-flex items-center gap-3 px-12 py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-xl transition-all shadow-2xl shadow-emerald-500/30 active:scale-95"
                    >
                        🚀 Start Free Trial Now
                    </Link>
                </div>
            </section>

            <SimpleFooter />
        </div>
    )
}
