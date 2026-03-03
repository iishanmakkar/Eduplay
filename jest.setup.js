import '@testing-library/jest-dom'

// ── Global teardown: unref open handles so Node exits cleanly ─────────────────
// Prisma, Redis, and other lazy-loaded modules leave alive handles in the event
// loop even after tests finish. We do NOT call $disconnect() here because the
// CI DATABASE_URL is a dummy value — connecting would hang. Instead we just
// unref() every active OS handle so they no longer block the process from exiting.
afterAll(() => {
    if (typeof process._getActiveHandles === 'function') {
        process._getActiveHandles().forEach((h) => {
            if (typeof h.unref === 'function') h.unref()
        })
    }
})


