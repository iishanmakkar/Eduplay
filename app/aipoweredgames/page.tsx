import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'AI-Powered Games | EduPlay',
    description: 'Next-generation AI-driven adaptive learning experiences tailored to every student.',
}

const AI_GAMES = [
    {
        key: 'math-ai',
        title: 'AI Live Math Generator',
        description: 'Infinite adaptive math questions generated and validated in real-time by AI, calibrated to your exact skill level.',
        icon: '∞',
        color: 'from-violet-600 to-purple-700',
        badge: 'Adaptive',
        href: '/aipoweredgames/math-ai',
    },
    {
        key: 'adaptive-challenge',
        title: 'AI Adaptive Olympiad',
        description: 'Competitive olympiad-style challenges that dynamically adjust difficulty and topic based on your Bayesian mastery profile.',
        icon: '🏆',
        color: 'from-amber-500 to-orange-600',
        badge: 'BKT-Powered',
        href: '/aipoweredgames/adaptive-challenge',
    },
    {
        key: 'essay-ai',
        title: 'AI Essay Evaluator',
        description: 'Submit essays on any topic. AI scores your writing on content, structure, and language — with detailed rubric feedback.',
        icon: '✍️',
        color: 'from-blue-500 to-cyan-600',
        badge: 'Rubric-Based',
        href: '/aipoweredgames/essay-ai',
    },
    {
        key: 'debate-ai',
        title: 'AI Real-Time Debate Coach',
        description: 'Practice structured debates with AI that evaluates your argument quality, evidence, and logical coherence in real-time.',
        icon: '🎙️',
        color: 'from-rose-500 to-pink-600',
        badge: 'Real-Time',
        href: '/aipoweredgames/debate-ai',
    },
    {
        key: 'science-ai',
        title: 'AI Personalized Weakness Trainer',
        description: 'AI analyzes your skill gaps across all subjects and serves targeted practice on exactly what you need to improve.',
        icon: '🎯',
        color: 'from-emerald-500 to-teal-600',
        badge: 'Personalized',
        href: '/aipoweredgames/science-ai',
    },
    {
        key: 'language-ai',
        title: 'AI Language Fluency Engine',
        description: 'Master English and Hindi through AI-generated comprehension, grammar, and vocabulary exercises with instant feedback.',
        icon: '🗣️',
        color: 'from-indigo-500 to-blue-600',
        badge: 'Multilingual',
        href: '/aipoweredgames/language-ai',
    },
    {
        key: 'research-lab',
        title: 'AI Research Lab',
        description: 'Explore any topic through an AI-guided Socratic learning experience that teaches you to ask better questions.',
        icon: '🔬',
        color: 'from-slate-500 to-zinc-600',
        badge: 'Socratic',
        href: '/aipoweredgames/research-lab',
    },
    {
        key: 'project-lab',
        title: 'AI Project-Based Learning',
        description: 'Complete rich, multi-week project simulations with AI guidance, peer review, and authentic assessment — all virtual.',
        icon: '🚀',
        color: 'from-fuchsia-500 to-purple-600',
        badge: 'Project-Based',
        href: '/aipoweredgames/project-lab',
    },
]

export default function AIGamesHub() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <div className="relative overflow-hidden border-b border-slate-800/60">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-purple-600/5 to-indigo-600/10 pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 py-16 text-center relative">
                    <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1.5 text-violet-300 text-sm font-medium mb-6">
                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
                        Powered by Gemini AI
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
                        AI-Powered Games
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Next-generation learning experiences that adapt in real-time to every student&apos;s unique needs.
                        Every question generated. Every answer validated. Every session personalized.
                    </p>
                </div>
            </div>

            {/* Game Grid */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {AI_GAMES.map((game) => (
                        <Link
                            key={game.key}
                            href={game.href}
                            className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm hover:border-slate-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10"
                        >
                            {/* Gradient aura */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                            <div className="p-6 relative">
                                {/* Badge */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`text-xs font-bold bg-gradient-to-r ${game.color} bg-clip-text text-transparent border border-slate-700 rounded-full px-3 py-1`}>
                                        {game.badge}
                                    </span>
                                    <span className="text-xs text-violet-400 font-mono">AI</span>
                                </div>

                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    {game.icon}
                                </div>

                                {/* Content */}
                                <h3 className="text-white font-bold text-base mb-2 leading-snug">
                                    {game.title}
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {game.description}
                                </p>

                                {/* CTA */}
                                <div className="mt-5 flex items-center gap-2 text-violet-400 text-sm font-semibold group-hover:text-violet-300 transition-colors">
                                    Start Playing
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Info banner */}
                <div className="mt-10 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6 text-center">
                    <p className="text-slate-300 text-sm">
                        <span className="text-violet-400 font-semibold">AI integrity guarantee:</span>
                        {' '}Every AI-generated question passes our{' '}
                        <code className="text-violet-300 bg-slate-800/60 px-1.5 py-0.5 rounded font-mono text-xs">
                            validateAIOutputIntegrity()
                        </code>
                        {' '}validation pipeline before being served to any student.
                    </p>
                </div>
            </div>
        </div>
    )
}
