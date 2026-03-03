'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

interface LimitReachedModalProps {
    isOpen: boolean
    onClose: () => void
    resource: string // e.g., "Students", "Classes"
    limit: number
}

export default function LimitReachedModal({ isOpen, onClose, resource, limit }: LimitReachedModalProps) {
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
                                <div className="flex items-center gap-5 mb-6 text-coral">
                                    <div className="p-4 bg-coral/10 dark:bg-coral/20 rounded-2xl shadow-sm">
                                        <AlertTriangle className="w-10 h-10" />
                                    </div>
                                    <Dialog.Title
                                        as="h3"
                                        className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight"
                                    >
                                        Limit Reached
                                    </Dialog.Title>
                                </div>

                                <div className="mt-2 text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                    <p className="mb-4">
                                        You have reached the limit of <span className="font-bold text-slate-900 dark:text-white underline decoration-coral/30">{limit} {resource}</span> for your current plan.
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-500 mb-8">
                                        To add more {resource.toLowerCase()}, you&apos;ll need to upgrade your subscription level.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <Link
                                        href="/dashboard/billing"
                                        className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-center shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
                                    >
                                        Upgrade Plan Now →
                                    </Link>
                                    <button
                                        type="button"
                                        className="w-full py-4 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
                                        onClick={onClose}
                                    >
                                        I&apos;ll Do It Later
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
