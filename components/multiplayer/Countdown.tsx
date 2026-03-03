'use client'

/**
 * Countdown Component
 * 3-2-1-GO! animation before game starts
 */

import { useEffect, useState } from 'react'
import { soundManager } from '@/lib/multiplayer/sounds'

interface CountdownProps {
    onComplete: () => void
    duration?: number // in seconds, default 3
}

export default function Countdown({ onComplete, duration = 3 }: CountdownProps) {
    const [count, setCount] = useState(duration)
    const [showGo, setShowGo] = useState(false)

    useEffect(() => {
        // Play countdown sounds (without passing the callback here as it's handled by the local timer)
        soundManager.playCountdown()

        // Countdown timer
        const interval = setInterval(() => {
            setCount((prev) => {
                if (prev <= 1) {
                    clearInterval(interval)
                    setShowGo(true)
                    setTimeout(() => {
                        onComplete()
                    }, 800)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [onComplete])

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="text-center">
                {!showGo ? (
                    <div
                        className="countdown-number text-[20rem] font-black text-white"
                        key={count}
                    >
                        {count}
                    </div>
                ) : (
                    <div className="countdown-go text-[20rem] font-black text-green-500">
                        GO!
                    </div>
                )}
            </div>
        </div>
    )
}
