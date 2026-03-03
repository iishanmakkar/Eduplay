# Monitoring Setup

We use a combination of tools to ensure system health and rapid incident response.

## Error Tracking (Sentry)

-   **Client-side**: Captures unhandled React exceptions and UI crashes.
-   **Server-side**: Captures API errors and database failures.
-   **Performance**: Traces slow transactions (e.g., long API calls).

### Alerts
Configure Sentry to email/Slack the engineering team when:
-   New issue frequency > 10 in 5 minutes.
-   Any `Fatal` error occurs.

## Infrastructure Monitoring

If hosting on **Vercel/Railway**:
-   Monitor **CPU/Memory** usage of serverless functions.
-   Check **Bandwidth** limits.

## Database Monitoring (Neon)

-   Check **Active Connections** vs limit.
-   Monitor **Storage Usage**.
-   Set up alerts for **Slow Queries** (> 500ms).
