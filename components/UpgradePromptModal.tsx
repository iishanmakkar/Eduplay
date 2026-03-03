'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Link from 'next/link'
import { CheckIcon } from 'lucide-react'

interface UpgradeModalProps {
    isOpen: boolean
    onClose: () => void
    triggerReason?: string // e.g., "limit_reached", "feature_locked"
}

export default function UpgradePromptModal({ isOpen, onClose, triggerReason }: UpgradeModalProps) {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white dark:bg-slate-800 p-8 text-left align-middle shadow-2xl transition-all border border-slate-200 dark:border-slate-700">
                                <div className="text-center mb-8">
                                    <div className="mx-auto w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-sm">
                                        👑
                                    </div>
                                    <Dialog.Title
                                        as="h3"
                                        className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2"
                                    >
                                        Unlock Full Potential
                                    </Dialog.Title>
                                    <div className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
                                        <p>
                                            {triggerReason === 'limit_reached'
                                                ? "You've reached the limits of your current plan. Upgrade to add more students and classes."
                                                : "This feature is available exclusively on our School and District plans."
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 mb-8 space-y-4 border border-slate-100 dark:border-slate-700/50">
                                    {[
                                        "Unlimited Students & Teachers",
                                        "Advanced Analytics Dashboard",
                                        "Priority Support",
                                        "Custom Branding"
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="flex-shrink-0 w-6 h-6 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                                <CheckIcon className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-4">
                                    <Link
                                        href="/dashboard/billing"
                                        className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-bold text-center shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all transform active:scale-95"
                                    >
                                        View Upgrade Options
                                    </Link>
                                    <button
                                        type="button"
                                        className="w-full py-2 text-sm font-bold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                                        onClick={onClose}
                                    >
                                        Maybe Later
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
