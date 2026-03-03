'use client'

import { usePathname } from 'next/navigation'
import MaintenanceScreen from './MaintenanceScreen'

interface MaintenanceGuardProps {
    children: React.ReactNode
    active: boolean
    userRole?: string
}

export default function MaintenanceGuard({ children, active, userRole }: MaintenanceGuardProps) {
    const pathname = usePathname()

    // Configuration
    const isOwner = userRole === 'OWNER'
    const isAuthRoute = pathname?.startsWith('/auth') || pathname?.startsWith('/api/auth')
    const isSystemRoute = pathname?.startsWith('/_next') || pathname?.startsWith('/favicon.ico')

    // If maintenance is active, enforce rules
    if (active) {
        // Allow Owners, Auth routes, and System assets always
        if (isOwner || isAuthRoute || isSystemRoute) {
            return <>{children}</>
        }

        // Block everyone else
        return <MaintenanceScreen />
    }

    // Maintenance inactive - show content
    return <>{children}</>
}
