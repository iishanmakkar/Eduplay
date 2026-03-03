# Service Level Objectives (SLOs) v2 - Enterprise Edition

This document formally defines the reliability thresholds that the EduPlay platform engineers guarantee to Enterprise B2B clients (School Districts).

## Reliability Tier: Tier 1 (Mission Critical during school hours)

### 1. Availability Objective (Uptime)
**SLO**: `99.9%` (Less than 43m 49s downtime per month).
**SLI (Indicator)**: The proportion of all global HTTP requests yielding a `200` to `499` response status, measured externally via synthetic ping every 10 seconds.
**Error Budget Policy**: 
- If budget drops below 50% for the month, all feature work freezes. SRE pivots entirely to stability.

### 2. Request Latency Objective
**SLO**: `< 300ms p95`
**SLI**: 95% of standard API requests over a 5-minute rolling window must return a response to the edge within 300ms.
**Exclusions**: `/api/ai-games/generate` and `/api/ai-games/evaluate-essay` which heavily rely on external LLM inference.

### 3. AI Inference Latency Objective
**SLO**: `< 2s p95`
**SLI**: 95% of successful `/api/ai-games/generate` requests must stream the first chunk to the client within 2 seconds.
**Mitigation**: Cache identical subject/topic/gradeBand requests in Redis (`NX` with `EX 86400`) to guarantee this objective if the LLM provider degrades.

### 4. Data Loss & Submission Accuracy Objective
**SLO**: `< 0.1% transaction failure`
**SLI**: Less than 0.1% of `/api/games/save-result` endpoints yield a 5xx error or DB timeout.
**Mitigation**: The `save-result` endpoint uses a local IndexedDB queue on the client to retry failed submissions if the server briefly rejects them.

---

## Observability Monitors & Alerting
Metrics validating these SLOs feed directly into `lib/observability/alerts.ts`. 

- **Error Spikes**: Triggers PagerDuty to On-Call SRE if 5xx traffic > 3% in a 5-minute window.
- **Latency Spikes**: Datadog alerts engineering slack if rolling 10m p95 latency > 500ms.

Approved by: `Chief Enterprise Architect`
Date: March 2026
