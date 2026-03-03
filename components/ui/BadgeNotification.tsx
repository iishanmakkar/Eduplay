
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BadgeDefinition } from '@/lib/gamification/badges'
import confetti from 'canvas-confetti'

interface BadgeNotificationProps {
    badges: BadgeDefinition[]
    levelUp?: {
        oldLevel: number
        newLevel: number
    }
    onComplete?: () => void
}

export default function BadgeNotification({ badges, levelUp, onComplete }: BadgeNotificationProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [showLevelUp, setShowLevelUp] = useState(!!levelUp)
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        if (badges.length > 0 || levelUp) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FFA500', '#FF4500']
            })
        }
    }, [badges.length, levelUp])

    const handleNext = () => {
        if (showLevelUp) {
            setShowLevelUp(false)
            if (badges.length === 0) {
                setVisible(false)
                onComplete?.()
            }
        } else if (currentIndex < badges.length - 1) {
            setCurrentIndex(prev => prev + 1)
        } else {
            setVisible(false)
            onComplete?.()
        }
    }

    if (!visible) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden"
                >
                    {/* Background Shine */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent pointer-events-none" />

                    {showLevelUp && levelUp ? (
                        <div className="space-y-6">
                            <div className="text-6xl animate-bounce">⬆️</div>
                            <h2 className="text-3xl font-black text-gray-900">LEVEL UP!</h2>
                            <div className="flex items-center justify-center gap-4">
                                <span className="text-4xl font-bold text-gray-400">{levelUp.oldLevel}</span>
                                <span className="text-3xl text-gray-300">→</span>
                                <span className="text-6xl font-black text-yellow-500">{levelUp.newLevel}</span>
                            </div>
                            <p className="text-gray-600">You&apos;re becoming a legend! Keep it up!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="relative inline-block">
                                <div className="text-8xl mb-4 drop-shadow-lg">{badges[currentIndex]?.icon}</div>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-4 border-dashed border-yellow-400 rounded-full opacity-20"
                                />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-600 mb-1">
                                    New Badge Unlocked!
                                </h3>
                                <h2 className="text-3xl font-black text-gray-900 uppercase">
                                    {badges[currentIndex]?.name}
                                </h2>
                            </div>
                            <p className="text-gray-600 italic">
                                &quot;{badges[currentIndex]?.description}&quot;
                            </p>
                            <div className="flex justify-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${badges[currentIndex]?.rarity === 'LEGENDARY' ? 'bg-yellow-100 text-yellow-700' :
                                    badges[currentIndex]?.rarity === 'EPIC' ? 'bg-purple-100 text-purple-700' :
                                        badges[currentIndex]?.rarity === 'RARE' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                    }`}>
                                    {badges[currentIndex]?.rarity}
                                </span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleNext}
                        className="mt-8 w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors active:scale-95"
                    >
                        {showLevelUp ? 'AWESOME!' : (currentIndex < badges.length - 1 ? 'NEXT BADGE' : 'COLLECT ALL')}
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
