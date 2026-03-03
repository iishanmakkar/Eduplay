import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Content Lab | EduPlay Admin',
    description: 'AI-powered bulk question generation, review, and publishing pipeline.',
}

const TOOLS = [
    {
        href: '/admin/content-lab/generate',
        icon: '⚡',
        title: 'Bulk Generate',
        description: 'Generate 500 validated questions at once using Gemini AI. Select game, grade, and difficulty — AI does the rest.',
        color: 'from-violet-600 to-purple-700',
        badge: 'AI-Powered',
    },
    {
        href: '/admin/content-lab/review',
        icon: '🔍',
        title: 'Review Queue',
        description: 'Human review of AI-generated questions before publishing. Approve, edit, or reject individual items.',
        color: 'from-amber-500 to-orange-600',
        badge: 'Human Review',
    },
    {
        href: '/admin/content-lab/publish',
        icon: '🚀',
        title: 'Publish',
        description: 'Publish approved questions to the live GameQuestion database with automatic curriculum alignment and hash signing.',
        color: 'from-emerald-500 to-teal-600',
        badge: 'Atomic',
    },
]

export default function ContentLabPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
                    <Link href="/dashboard" className="hover:text-slate-300">Dashboard</Link>
                    <span>/</span>
                    <Link href="/admin" className="hover:text-slate-300">Admin</Link>
                    <span>/</span>
                    <span className="text-violet-400">Content Lab</span>
                </div>

                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-white mb-2">Content Lab</h1>
                    <p className="text-slate-400">
                        AI-assisted question generation pipeline. All questions are validated by
                        <code className="text-violet-300 bg-slate-800 px-1.5 py-0.5 rounded text-xs mx-1">
                            validateQuestionIntegrity()
                        </code>
                        before reaching students.
                    </p>
                </div>

                {/* Pipeline steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                    {TOOLS.map((tool, i) => (
                        <Link
                            key={tool.href}
                            href={tool.href}
                            className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/60 hover:border-slate-600 transition-all duration-300 hover:-translate-y-1 p-6"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-slate-500 text-sm font-mono">Step {i + 1}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border border-slate-700 bg-gradient-to-r ${tool.color} bg-clip-text text-transparent`}>
                                        {tool.badge}
                                    </span>
                                </div>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-xl mb-4`}>
                                    {tool.icon}
                                </div>
                                <h3 className="text-white font-bold text-lg mb-2">{tool.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{tool.description}</p>
                                <div className="mt-4 text-violet-400 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Open <span>&#8594;</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Stats bar */}
                <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5 grid grid-cols-3 gap-4 text-center">
                    {[
                        { label: 'Questions in DB', value: '—' },
                        { label: 'Drafts Pending Review', value: '—' },
                        { label: 'Published This Week', value: '—' },
                    ].map(stat => (
                        <div key={stat.label}>
                            <div className="text-2xl font-black text-white">{stat.value}</div>
                            <div className="text-slate-500 text-xs mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
