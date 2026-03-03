/**
 * Edge-compatible JSON structured logger for Enterprise Observability.
 * Provides a unified interface for emitting structured telemetry data
 * that can be ingested by Datadog, Sentry, or standard CloudWatch.
 */

export function createCronLogger(jobName: string) {
    return {
        start: (context: Record<string, any> = {}) => {
            console.log(JSON.stringify({
                level: 'INFO',
                message: 'cron_start',
                metadata: {
                    service: 'eduplay-cron',
                    job: jobName,
                    timestamp: new Date().toISOString(),
                    ...context
                }
            }))
        },
        success: (context: Record<string, any> = {}) => {
            console.log(JSON.stringify({
                level: 'INFO',
                message: 'cron_success',
                metadata: {
                    service: 'eduplay-cron',
                    job: jobName,
                    timestamp: new Date().toISOString(),
                    ...context
                }
            }))
        },
        error: (error: any, context: Record<string, any> = {}) => {
            console.error(JSON.stringify({
                level: 'ERROR',
                message: 'cron_error',
                metadata: {
                    service: 'eduplay-cron',
                    job: jobName,
                    timestamp: new Date().toISOString(),
                    error_message: error?.message || String(error),
                    stack: error?.stack,
                    ...context
                }
            }))
        }
    }
}

/**
 * Core application structured logger.
 */
export const logger = {
    info: (message: string, context: Record<string, any> = {}) => {
        console.log(JSON.stringify({
            level: 'INFO',
            message,
            metadata: {
                service: 'eduplay-api',
                timestamp: new Date().toISOString(),
                ...context
            }
        }))
    },
    warn: (message: string, context: Record<string, any> = {}) => {
        console.warn(JSON.stringify({
            level: 'WARN',
            message,
            metadata: {
                service: 'eduplay-api',
                timestamp: new Date().toISOString(),
                ...context
            }
        }))
    },
    error: (message: string, error: any, context: Record<string, any> = {}) => {
        console.error(JSON.stringify({
            level: 'ERROR',
            message,
            metadata: {
                service: 'eduplay-api',
                timestamp: new Date().toISOString(),
                error_message: error?.message || String(error),
                stack: error?.stack,
                ...context
            }
        }))
    },
    audit: (message: string, userId: string, context: Record<string, any> = {}) => {
        console.log(JSON.stringify({
            level: 'AUDIT',
            message,
            metadata: {
                service: 'eduplay-api',
                timestamp: new Date().toISOString(),
                userId,
                ...context
            }
        }))
    }
}

/**
 * Edge-compatible structured request logger.
 */
export function createRequestLogger(requestId: string, userId: string, baseContext: Record<string, any> = {}) {
    return {
        info: (message: string, context: Record<string, any> = {}) => {
            logger.info(message, { requestId, userId, ...baseContext, ...context })
        },
        warn: (message: string, context: Record<string, any> = {}) => {
            logger.warn(message, { requestId, userId, ...baseContext, ...context })
        },
        error: (message: string, error: any, context: Record<string, any> = {}) => {
            logger.error(message, error, { requestId, userId, ...baseContext, ...context })
        }
    }
}
