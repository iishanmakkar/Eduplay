'use client'

import { motion } from 'framer-motion'

export default function MaintenanceScreen() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-900 text-white p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-lg"
            >
                <div className="text-8xl mb-6">🚧</div>
                <h1 className="text-4xl font-bold mb-4 font-display">Under Maintenance</h1>
                <p className="text-gray-400 text-lg mb-8">
                    We are currently performing scheduled maintenance to improve your experience.
                    Please check back soon.
                </p>
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400">Estimated downtime: <span className="text-white font-mono">~30 minutes</span></p>
                </div>
            </motion.div>
        </div>
    )
}
