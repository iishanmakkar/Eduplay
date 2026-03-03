'use client'

/**
 * Smartboard Controls
 * Settings panel for classroom smartboard mode
 */

import { useState } from 'react'

interface SmartboardControlsProps {
    smartboardMode: boolean
    touchOptimized: boolean
    soundEffects: boolean
    showCompetitionBar: boolean
    onToggleSmartboard: (enabled: boolean) => void
    onToggleTouch: (enabled: boolean) => void
    onToggleSounds: (enabled: boolean) => void
    onToggleCompetitionBar: (enabled: boolean) => void
    onToggleFullscreen: () => void
}

export default function SmartboardControls({
    smartboardMode,
    touchOptimized,
    soundEffects,
    showCompetitionBar,
    onToggleSmartboard,
    onToggleTouch,
    onToggleSounds,
    onToggleCompetitionBar,
    onToggleFullscreen
}: SmartboardControlsProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="fixed top-4 right-4 z-50">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-gray-800 text-white p-4 rounded-full shadow-2xl hover:bg-gray-700 transition-all touch-target"
                title="Settings"
            >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>

            {/* Settings Panel */}
            {isOpen && (
                <div className="absolute top-16 right-0 bg-white rounded-2xl shadow-2xl p-6 w-96 border-4 border-gray-200">
                    <h3 className="text-2xl font-bold mb-6 text-gray-800">Game Settings</h3>

                    {/* Smartboard Mode */}
                    <div className="mb-6">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <div className="text-lg font-semibold text-gray-800">Smartboard Mode</div>
                                <div className="text-sm text-gray-500">2x larger UI for classrooms</div>
                            </div>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={smartboardMode}
                                    onChange={(e) => onToggleSmartboard(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-14 h-8 rounded-full transition-colors ${smartboardMode ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${smartboardMode ? 'translate-x-7' : 'translate-x-1'} mt-1`} />
                                </div>
                            </div>
                        </label>
                    </div>

                    {/* Touch Optimized */}
                    <div className="mb-6">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <div className="text-lg font-semibold text-gray-800">Touch Optimized</div>
                                <div className="text-sm text-gray-500">60px+ tap targets</div>
                            </div>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={touchOptimized}
                                    onChange={(e) => onToggleTouch(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-14 h-8 rounded-full transition-colors ${touchOptimized ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${touchOptimized ? 'translate-x-7' : 'translate-x-1'} mt-1`} />
                                </div>
                            </div>
                        </label>
                    </div>

                    {/* Sound Effects */}
                    <div className="mb-6">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <div className="text-lg font-semibold text-gray-800">Sound Effects</div>
                                <div className="text-sm text-gray-500">Game sounds & music</div>
                            </div>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={soundEffects}
                                    onChange={(e) => onToggleSounds(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-14 h-8 rounded-full transition-colors ${soundEffects ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${soundEffects ? 'translate-x-7' : 'translate-x-1'} mt-1`} />
                                </div>
                            </div>
                        </label>
                    </div>

                    {/* Competition Bar */}
                    <div className="mb-6">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <div className="text-lg font-semibold text-gray-800">Competition Bar</div>
                                <div className="text-sm text-gray-500">Show tug-of-war bar</div>
                            </div>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={showCompetitionBar}
                                    onChange={(e) => onToggleCompetitionBar(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-14 h-8 rounded-full transition-colors ${showCompetitionBar ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${showCompetitionBar ? 'translate-x-7' : 'translate-x-1'} mt-1`} />
                                </div>
                            </div>
                        </label>
                    </div>

                    {/* Fullscreen Button */}
                    <button
                        onClick={onToggleFullscreen}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition-all touch-target"
                    >
                        🖥️ Toggle Fullscreen
                    </button>

                    {/* Close Button */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full mt-4 bg-gray-200 text-gray-700 py-3 rounded-xl text-lg font-semibold hover:bg-gray-300 transition-all"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    )
}
