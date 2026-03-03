import { useRef, useCallback } from 'react'

/**
 * useSubmissionLock — 200ms debounce lock for game answer submission.
 * Prevents: double-taps, multi-touch conflicts, timer race conditions.
 *
 * Usage:
 *   const lock = useSubmissionLock()
 *   const handleAnswer = (opt: string) => {
 *     if (!lock()) return  // already locked
 *     // process answer...
 *   }
 */
export function useSubmissionLock(delayMs = 200) {
    const lockRef = useRef(false)

    const lock = useCallback(() => {
        if (lockRef.current) return false  // already locked — reject
        lockRef.current = true
        setTimeout(() => {
            lockRef.current = false
        }, delayMs)
        return true  // lock acquired
    }, [delayMs])

    const forceUnlock = useCallback(() => {
        lockRef.current = false
    }, [])

    const isLocked = useCallback(() => lockRef.current, [])

    return { lock, forceUnlock, isLocked }
}
