import { ReactNode } from 'react'

interface CardProps {
    children: ReactNode
    className?: string
}

export function Card({ children, className = '' }: CardProps) {
    return (
        <div className={`bg-white dark:bg-fixed-medium rounded-xl shadow-sm border border-gray-100 dark:border-border transition-colors duration-300 ${className}`}>
            {children}
        </div>
    )
}
