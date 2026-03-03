import '@testing-library/jest-dom'

// ── Global teardown: close all open handles so Jest exits cleanly ─────────────
// Without this, Prisma (and any lazy-loaded Redis clients) keep event loops
// alive indefinitely, causing Jest to hang after all tests PASS.
afterAll(async () => {
    // 1. Disconnect any Prisma clients that were instantiated during tests
    try {
        // Dynamically require to avoid top-level side effects
        // eslint-disable-next-line
        const { prisma } = require('@/lib/prisma')
        if (prisma && typeof prisma.$disconnect === 'function') {
            await prisma.$disconnect()
        }
    } catch {
        // Prisma may not have been loaded in this test run — safe to ignore
    }

    // 2. Clear any lingering timers (setInterval / setTimeout in modules)
    // jest.clearAllTimers() only clears mocked timers. For real timers we use
    // process._getActiveHandles() introspection to spot and unref them.
    if (typeof process._getActiveHandles === 'function') {
        process._getActiveHandles().forEach((h) => {
            if (typeof h.unref === 'function') h.unref()
        })
    }
})

