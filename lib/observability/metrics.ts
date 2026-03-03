/**
 * lib/observability/metrics.ts
 *
 * PHASE 1 — Observability Stack (Metrics Collection)
 *
 * Implements an in-memory counter/gauge system for Prometheus/Datadog scraping.
 * In a real massive-scale production environment, this would push specifically
 * to a StatsD / DataDog agent via UDP, but for standard Next.js deployments,
 * scraping a /metrics endpoint is the standard practice.
 */

// ── Types ───────────────────────────────────────────────────────────────────

type MetricType = 'counter' | 'gauge' | 'histogram'

interface MetricLabel {
    [key: string]: string | number | boolean
}

class Metric {
    public value: number = 0
    // Simplified histogram bins
    public sum: number = 0
    public count: number = 0

    constructor(
        public readonly name: string,
        public readonly type: MetricType,
        public readonly help: string,
        public readonly labels: MetricLabel = {}
    ) { }

    inc(amount: number = 1): void {
        this.value += amount
    }

    set(val: number): void {
        this.value = val
    }

    observe(val: number): void {
        this.sum += val
        this.count++
        // We track latest for simplicity; a true Prometheus client maintains buckets
        this.value = val
    }

    serialize(): string {
        const labelStrs = Object.entries(this.labels).map(([k, v]) => `${k}="${v}"`)
        const labelPart = labelStrs.length > 0 ? `{${labelStrs.join(',')}}` : ''

        if (this.type === 'histogram') {
            // simplified Prometheus format for sum/count
            return `${this.name}_sum${labelPart} ${this.sum}\n${this.name}_count${labelPart} ${this.count}`
        }
        return `${this.name}${labelPart} ${this.value}`
    }
}

// ── Registry ────────────────────────────────────────────────────────────────

class MetricsRegistry {
    private metrics: Map<string, Metric> = new Map()

    private getOrCreate(name: string, type: MetricType, help: string, labels: MetricLabel = {}): Metric {
        // Unique key based on name + labels
        const key = `${name}_${JSON.stringify(labels)}`
        if (!this.metrics.has(key)) {
            this.metrics.set(key, new Metric(name, type, help, labels))
        }
        return this.metrics.get(key)!
    }

    // -- API Request Metrics
    apiRequestsTotal(route: string, status: number): Metric {
        return this.getOrCreate('http_requests_total', 'counter', 'Total HTTP requests', { route, status })
    }

    apiLatency(route: string): Metric {
        return this.getOrCreate('http_request_duration_ms', 'histogram', 'HTTP request latency', { route })
    }

    // -- AI Metrics
    aiGenerationsTotal(subject: string, status: string): Metric {
        return this.getOrCreate('ai_generations_total', 'counter', 'Total AI question generations', { subject, status })
    }

    aiGenerationLatency(subject: string): Metric {
        return this.getOrCreate('ai_generation_duration_ms', 'histogram', 'AI generation latency', { subject })
    }

    aiTokensUsed(model: string): Metric {
        return this.getOrCreate('ai_tokens_total', 'counter', 'Total AI tokens used', { model })
    }

    // -- Game Metrics
    gameSubmissionsTotal(game_type: string): Metric {
        return this.getOrCreate('game_submissions_total', 'counter', 'Total game score submissions', { game_type })
    }

    gameSubmissionErrors(reason: string): Metric {
        return this.getOrCreate('game_submission_errors', 'counter', 'Game submission validation errors', { reason })
    }

    // -- Security Metrics
    rateLimitTriggers(endpoint: string): Metric {
        return this.getOrCreate('rate_limit_hits_total', 'counter', 'Rate limit triggers', { endpoint })
    }

    aiSecurityBlocks(reason: string): Metric {
        return this.getOrCreate('ai_security_blocks_total', 'counter', 'AI prompt/output blocked', { reason })
    }

    // -- Database Metrics
    dbQueryLatency(operation: string): Metric {
        return this.getOrCreate('db_query_duration_ms', 'histogram', 'Database query latency', { operation })
    }

    // -- Exporter
    exportPrometheus(): string {
        const lines: string[] = []
        const grouped = new Map<string, Metric[]>()

        for (const metric of this.metrics.values()) {
            if (!grouped.has(metric.name)) grouped.set(metric.name, [])
            grouped.get(metric.name)!.push(metric)
        }

        for (const [name, metricList] of grouped.entries()) {
            const first = metricList[0]
            lines.push(`# HELP ${name} ${first.help}`)
            lines.push(`# TYPE ${name} ${first.type}`)
            for (const metric of metricList) {
                lines.push(metric.serialize())
            }
        }

        return lines.join('\n') + '\n'
    }
}

// Global singleton to survive Next.js dev reloads
const globalMetrics = global as unknown as { metricsRegistry: MetricsRegistry }
export const metrics = globalMetrics.metricsRegistry || new MetricsRegistry()

if (process.env.NODE_ENV !== 'production') {
    globalMetrics.metricsRegistry = metrics
}
