# System Overview

## High Level Architecture

EduPlay Pro is a modern SaaS platform built on the **T3 Stack** (Next.js, TypeScript, Tailwind CSS, Prisma).

```mermaid
graph TD
    User[User (Teacher/Student/Admin)] -->|HTTPS| CDN[CDN / Edge Network]
    CDN -->|Load Balance| App[Next.js App Server]
    
    subgraph "Application Layer"
        App -->|Auth| NextAuth[NextAuth.js]
        App -->|API| API[API Routes]
        App -->|Pages| UI[React Components]
    end
    
    subgraph "Data Layer"
        API -->|ORM| Prisma[Prisma Client]
        Prisma -->|Reads/Writes| DB[(PostgreSQL Database)]
        API -->|Cache| Redis[(Redis Cache)]
    end
    
    subgraph "External Services"
        API -->|Payments| Razorpay[Razorpay]
        API -->|Emails| Resend[Resend API]
        API -->|Monitoring| Sentry[Sentry]
    end
```

## Key Components

1.  **Frontend**: Next.js 14 (App Router) with Tailwind CSS for styling and Framer Motion for animations.
2.  **Backend**: Next.js API Routes (Serverless functions) handling business logic.
3.  **Database**: PostgreSQL hosted on Neon (Serverless Postgres).
4.  **Caching**: Upstash Redis for rate limiting and data caching.
5.  **Authentication**: NextAuth.js handling sessions and JWTs.
6.  **Payments**: Razorpay integration for subscription management.
