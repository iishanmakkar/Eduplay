# EduPlay SLO — Service Level Objectives
*Last updated: February 2026*

## Availability

| Metric | Target | Measurement |
|---|---|---|
| **Platform Uptime** | 99.9% | ≤ 8.7 hrs downtime/year |
| **API Success Rate** | ≥ 99.5% | Non-5xx responses / total requests |
| **Webhook Delivery** | < 0.1% failure rate | `WebhookEvent.status = 'DEAD'` / total events |

## Latency

| Endpoint Category | p50 Target | p95 Target | p99 Target |
|---|---|---|---|
| Game result save | < 100ms | < 300ms | < 800ms |
| Leaderboard fetch | < 10ms | < 30ms | < 100ms |
| Dashboard load | < 200ms | < 500ms | < 1500ms |
| Auth / login | < 150ms | < 400ms | < 1000ms |
| **DB query (any)** | < 50ms | **< 200ms** | < 500ms |

## BKT / AI

| Metric | Target |
|---|---|
| BKT update silent failure rate | < 0.01% |
| P(L) out-of-bounds events | 0 (enforced by `clampProbability`) |
| Mastery recalibration completed | 100% of stale records each month |

## Error Budget

| Period | Allowed Downtime | Allowed Error Volume |
|---|---|---|
| Monthly | 43.8 minutes | 0.5% of requests |
| Weekly | 10.1 minutes | 0.5% of requests |

## Alert Thresholds

| Alert | Threshold | Severity |
|---|---|---|
| `DB_LATENCY_HIGH` | latencyMs > 200ms on `/api/health/db` | Warning |
| `POOL_PRESSURE_HIGH` | Active connections > 70% of pool max | Warning |
| `WEBHOOK_DLQ_EVENT` | Any event enters DEAD status | Critical |
| `DB_UNHEALTHY` | `/api/health/db` returns 503 | Critical |
| BKT cron failure | recalibrate-bkt returns error | Warning |

## Measurement Points

- **Uptime**: `/api/health/db` polled every 60s by uptime monitor (Betterstack / UptimeRobot)
- **DB latency**: `latencyMs` field in `/api/health/db` response
- **Pool pressure**: `poolPressure` field in `/api/health/db` response
- **Webhook DLQ**: Query `SELECT count(*) FROM "WebhookEvent" WHERE status = 'DEAD'` daily

## Disaster Recovery

| Scenario | RTO Target | RPO Target | Current Status |
|---|---|---|---|
| DB primary failure | 30 min (manual Neon promotion) | 0 (synchronous replication) | ⚠️ Manual only |
| Redis failure | Instant (DB fallback active) | N/A | ✅ Automatic |
| CDN failure | Instant (Vercel auto-reroutes) | N/A | ✅ Automatic |
| Full region outage | 60 min | < 5 min data loss | ⚠️ Pre-200K scope |

> **Note**: Automated DB failover (RTO < 5 min) is targeted for the 200K user milestone when multi-region writes are implemented.
