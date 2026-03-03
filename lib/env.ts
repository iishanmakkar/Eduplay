import { z } from "zod";

const envSchema = z.object({
    // Database / Edge Connections
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DATABASE_POOL_URL: z.string().optional(),
    DATABASE_READONLY_URL: z.string().optional(),

    // Redis Setup
    REDIS_URL: z.string().url("REDIS_URL must be a valid URL"),

    // LLM Setup
    OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),

    // Auth configuration
    NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
    NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),

    // Cron & Governance
    CRON_SECRET: z.string().min(16, "CRON_SECRET must be at least 16 characters for Vercel Cron"),
    AI_COST_MONTHLY_LIMIT_DEFAULT: z.coerce.number().default(5),
    AI_COST_MONTHLY_LIMIT_PRO: z.coerce.number().default(100),
    AI_COST_MONTHLY_LIMIT_ENTERPRISE: z.coerce.number().default(500),
});

/**
 * Validates the current execution environment against the production schema.
 * Call this function dynamically inside server contexts to ensure fail-fast behaviors.
 */
export function validateEnv() {
    if (process.env.NODE_ENV !== "production") {
        // Standard dev fallback to avoid breaking local dev entirely if keys rotate
        return;
    }

    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        console.error("❌ Invalid or missing Environment Variables:");
        parsed.error.issues.forEach((issue) => {
            console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
        });
        console.error("The application will not start without these configured correctly.");
        process.exit(1);
    }
}
