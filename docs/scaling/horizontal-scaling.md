# Horizontal Scaling Strategy

As EduPlay Pro grows, components need to scale horizontally to handle increased load.

## Stateless Application

The Next.js app is stateless. Sessions are stored in the database (or JWTs).

-   **Scale Out**: Simply increase the number of container instances (Railway/Render) or let serverless auto-scale (Vercel).
-   **Load Balancer**: Requests are distributed automatically by the platform's edge network.

## Database Scaling

-   **Read Replicas**: Create read-only replicas in Neon/Postgres for heavy read operations (e.g., Analytics dashboard).
-   **Connection Pooling**: Use Prisma Data Proxy or PgBouncer to manage database connections efficiently from serverless functions.

## Caching Layer

-   **Redis Cluster**: Upgrade Upstash plan to handle higher throughput.
-   **Strategy**: Cache more aggressively (increase TTL) during peak hours.
