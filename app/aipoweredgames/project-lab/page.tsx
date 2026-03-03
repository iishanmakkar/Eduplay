'use client'

import Link from 'next/link'

const AI_PROJECTS = [
    {
        id: 'news-app',
        title: 'Build a Student News App',
        subject: 'Computer Science + English',
        duration: '3 weeks',
        description: 'Design, build, and present a simple news aggregator. Practice UI design, content curation, and presentation skills.',
        phases: ['Research & Design', 'Build Prototype', 'Test & Iterate', 'Present'],
        icon: '📰',
        difficulty: 'Intermediate',
    },
    {
        id: 'eco-survey',
        title: 'Community Eco-Survey',
        subject: 'Science + Social Studies',
        duration: '2 weeks',
        description: 'Survey your local environment, collect data, analyze findings, and propose solutions to an environmental challenge.',
        phases: ['Observe & Question', 'Collect Data', 'Analyze', 'Present Solutions'],
        icon: '🌿',
        difficulty: 'Beginner',
    },
    {
        id: 'math-game',
        title: 'Design a Math Game',
        subject: 'Mathematics + Design',
        duration: '2 weeks',
        description: 'Design rules for a card or board game that teaches a math concept. Play-test with peers and refine.',
        phases: ['Concept Design', 'Prototype & Rules', 'Play-Testing', 'Reflection'],
        icon: '🎲',
        difficulty: 'Beginner',
    },
    {
        id: 'historical-documentary',
        title: 'Mini Historical Documentary',
        subject: 'Social Studies + English',
        duration: '3 weeks',
        description: 'Research a historical event and create a short documentary script, storyboard, and presentation.',
        phases: ['Research', 'Script Writing', 'Storyboard', 'Final Presentation'],
        icon: '🎬',
        difficulty: 'Advanced',
    },
]

export default function ProjectLabPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-fuchsia-950/20 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/aipoweredgames" className="text-slate-500 hover:text-slate-300 text-sm">&#8592; AI Games</Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-fuchsia-400 text-sm font-medium">Project Lab</span>
                </div>

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-2xl">&#128640;</div>
                    <div>
                        <h1 className="text-2xl font-black text-white">AI Project-Based Learning</h1>
                        <p className="text-slate-400 text-sm">Multi-week projects with AI guidance and authentic assessment</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {AI_PROJECTS.map(project => (
                        <div
                            key={project.id}
                            className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6 hover:border-fuchsia-500/40 transition-all duration-300 cursor-pointer group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    {project.icon}
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${project.difficulty === 'Advanced' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                        : project.difficulty === 'Intermediate' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                    {project.difficulty}
                                </span>
                            </div>

                            <h3 className="text-white font-bold text-base mb-1">{project.title}</h3>
                            <div className="flex gap-3 mb-3">
                                <span className="text-xs text-fuchsia-400">{project.subject}</span>
                                <span className="text-xs text-slate-500">&#128337; {project.duration}</span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">{project.description}</p>

                            {/* Phases */}
                            <div className="flex items-center gap-1 flex-wrap mb-4">
                                {project.phases.map((phase, i) => (
                                    <div key={phase} className="flex items-center gap-1">
                                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-full border border-slate-700">
                                            {i + 1}. {phase}
                                        </span>
                                        {i < project.phases.length - 1 && <span className="text-slate-600">&#8594;</span>}
                                    </div>
                                ))}
                            </div>

                            <button className="w-full py-2.5 rounded-xl bg-fuchsia-600/20 hover:bg-fuchsia-600/40 text-fuchsia-300 font-bold text-sm border border-fuchsia-500/20 hover:border-fuchsia-500/40 transition-all">
                                Start Project with AI Guide &#8594;
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-8 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4 text-center">
                    <p className="text-slate-400 text-sm">
                        AI guides each project phase with Socratic prompts, rubric-based evaluation, and personalized feedback.
                        <span className="text-fuchsia-400 font-medium"> No busy work. Only authentic learning.</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
