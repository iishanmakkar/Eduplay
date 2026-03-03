'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { GAME_REGISTRY, Subject, GradeBand } from '@/lib/games/registry'

const SUBJECTS: Subject[] = [
    'Math', 'English', 'Science', 'SocialStudies', 'ComputerScience',
    'Hindi', 'GK', 'Simulation', 'CrossCurricular'
]

const SUBJECT_LABELS: Record<Subject, string> = {
    Math: '🧮 Mathematics',
    English: '📖 English',
    Science: '🔬 Science',
    SocialStudies: '🌍 Social Studies',
    ComputerScience: '💻 Computer Science',
    Hindi: '🌺 Hindi',
    GK: '🌟 GK & Life Skills',
    Simulation: '🏭 Simulations',
    CrossCurricular: '🌐 Cross-Curricular',
}

const GRADE_LABELS: Record<string, string> = {
    all: 'All Grades',
    kg2: 'KG – 2',
    '35': 'Grades 3–5',
    '68': 'Grades 6–8',
    '912': 'Grades 9–12',
}

const SUBJECT_COLORS: Record<Subject, string> = {
    Math: 'border-emerald-400/40 hover:border-emerald-400',
    English: 'border-sky-400/40 hover:border-sky-400',
    Science: 'border-violet-400/40 hover:border-violet-400',
    SocialStudies: 'border-amber-400/40 hover:border-amber-400',
    ComputerScience: 'border-blue-400/40 hover:border-blue-400',
    Hindi: 'border-rose-400/40 hover:border-rose-400',
    GK: 'border-orange-400/40 hover:border-orange-400',
    Simulation: 'border-teal-400/40 hover:border-teal-400',
    CrossCurricular: 'border-purple-400/40 hover:border-purple-400',
}

const SUBJECT_BADGE: Record<Subject, string> = {
    Math: 'bg-emerald-400/10 text-emerald-300',
    English: 'bg-sky-400/10 text-sky-300',
    Science: 'bg-violet-400/10 text-violet-300',
    SocialStudies: 'bg-amber-400/10 text-amber-300',
    ComputerScience: 'bg-blue-400/10 text-blue-300',
    Hindi: 'bg-rose-400/10 text-rose-300',
    GK: 'bg-orange-400/10 text-orange-300',
    Simulation: 'bg-teal-400/10 text-teal-300',
    CrossCurricular: 'bg-purple-400/10 text-purple-300',
}

export default function GamesPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSubject, setSelectedSubject] = useState<Subject | 'all'>('all')
    const [selectedGrade, setSelectedGrade] = useState<GradeBand | 'all'>('all')
    const [showNewOnly, setShowNewOnly] = useState(false)

    const filtered = GAME_REGISTRY.filter(g => {
        if (selectedSubject !== 'all' && g.subject !== selectedSubject) return false
        if (selectedGrade !== 'all' && g.grade !== selectedGrade && g.grade !== 'all') return false
        if (showNewOnly && !g.isNew) return false
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            return g.name.toLowerCase().includes(q) || g.topic.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)
        }
        return true
    })

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur border-b border-slate-800/60">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                    <Link href="/dashboard" className="text-sm font-semibold text-slate-400 hover:text-white transition shrink-0">
                        ← Dashboard
                    </Link>
                    <div className="font-display text-2xl font-bold">
                        Edu<span className="text-emerald-400">Play</span>
                        <span className="ml-2 text-xs font-normal text-slate-400">{filtered.length} games</span>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Hero */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-black mb-3">
                        Choose Your{' '}
                        <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                            Game 🎮
                        </span>
                    </h1>
                    <p className="text-slate-400">177 games · KG to Class 12 · Solo + 1v1</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-8">
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search games, topics…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="flex-1 min-w-[200px] px-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                    />

                    {/* Subject filter */}
                    <select
                        value={selectedSubject}
                        onChange={e => setSelectedSubject(e.target.value as Subject | 'all')}
                        className="px-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                        <option value="all">All Subjects</option>
                        {SUBJECTS.map(s => (
                            <option key={s} value={s}>{SUBJECT_LABELS[s]}</option>
                        ))}
                    </select>

                    {/* Grade filter */}
                    <select
                        value={selectedGrade}
                        onChange={e => setSelectedGrade(e.target.value as GradeBand | 'all')}
                        className="px-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                        {Object.entries(GRADE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </select>

                    {/* New only toggle */}
                    <button
                        onClick={() => setShowNewOnly(n => !n)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${showNewOnly
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-500'
                            }`}
                    >
                        ✨ New Games
                    </button>
                </div>

                {/* Subject groups */}
                {selectedSubject === 'all' && !searchQuery ? (
                    SUBJECTS.map(subject => {
                        const games = filtered.filter(g => g.subject === subject)
                        if (games.length === 0) return null
                        return (
                            <div key={subject} className="mb-10">
                                <h2 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
                                    {SUBJECT_LABELS[subject]}
                                    <span className="text-xs text-slate-500 font-normal">{games.length} games</span>
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {games.map(game => (
                                        <GameCard key={game.key} game={game} router={router} subjectColors={SUBJECT_COLORS} subjectBadge={SUBJECT_BADGE} gradeLabels={GRADE_LABELS} />
                                    ))}
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filtered.map(game => (
                            <GameCard key={game.key} game={game} router={router} subjectColors={SUBJECT_COLORS} subjectBadge={SUBJECT_BADGE} gradeLabels={GRADE_LABELS} />
                        ))}
                        {filtered.length === 0 && (
                            <div className="col-span-full text-center py-16 text-slate-500">
                                No games found. Try different filters.
                            </div>
                        )}
                    </div>
                )}

                {/* Daily Challenge */}
                <div className="mt-12 bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-2xl p-8">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="text-5xl">🎯</div>
                            <div>
                                <h3 className="text-2xl font-bold mb-1">Daily Challenge</h3>
                                <p className="text-slate-400 text-sm">Complete today&apos;s challenge for bonus XP!</p>
                            </div>
                        </div>
                        <Link href="/dashboard/student" className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition">
                            View Challenge
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}

function GameCard({ game, router, subjectColors, subjectBadge, gradeLabels }: {
    game: any; router: any; subjectColors: any; subjectBadge: any; gradeLabels: any
}) {
    return (
        <div className={`bg-slate-900/60 border-2 ${subjectColors[game.subject] || 'border-slate-700/40 hover:border-slate-500'} rounded-2xl p-5 transition-all group flex flex-col cursor-pointer hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5`}>
            {/* New badge */}
            {game.isNew && (
                <div className="self-start text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 mb-2">
                    ✨ NEW
                </div>
            )}
            <div className="text-5xl mb-3 text-center">{game.emoji}</div>
            <h3 className="text-sm font-bold text-white mb-1 group-hover:text-emerald-400 transition text-center leading-tight">
                {game.name}
            </h3>
            <p className="text-xs text-slate-500 mb-3 text-center line-clamp-2 flex-1">{game.description}</p>

            {/* Grade + Topic badges */}
            <div className="flex flex-wrap gap-1 justify-center mb-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${subjectBadge[game.subject] || 'bg-slate-700 text-slate-400'}`}>
                    {gradeLabels[game.grade] || game.grade}
                </span>
            </div>

            {/* Buttons */}
            <div className="mt-auto space-y-2">
                <button
                    onClick={() => router.push(`/games/play?type=${game.key}`)}
                    className="w-full py-2 text-xs bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-400 transition active:scale-95"
                >
                    Solo Play →
                </button>
                <button
                    onClick={() => router.push(`/games/play?type=${game.key}&mode=multiplayer`)}
                    className="w-full py-2 text-xs border border-purple-500/40 text-purple-400 rounded-lg font-bold hover:bg-purple-500/10 transition active:scale-95"
                >
                    ⚔️ 1v1
                </button>
            </div>
        </div>
    )
}
