# Deployment Architecture

EduPlay Pro is designed to be deployed on modern PaaS providers like Vercel, Railway, or Render.

```mermaid
graph TD
    subgraph "Client Side"
        Browser[Web Browser]
    end
    
    subgraph "Edge Network"
        Vercel[Vercel Edge / CDN]
    end
    
    subgraph "Compute"
        Serverless[Serverless Functions]
    end
    
    subgraph "Data Storage"
        Postgres[(Neon PostgreSQL)]
        Redis[(Upstash Redis)]
    end
    
    subgraph "Services"
        Cron[Cron Jobs]
        Queue[Background Workers]
    end
    
    Browser -->|Request| Vercel
    Vercel -->|Route| Serverless
    Serverless -->|Query| Postgres
    Serverless -->|Cache| Redis
    Cron -->|Trigger| Serverless
```

## Infrastructure Choices

-   **Hosting**: Agnostic (Railway/Render recommended for full control, Vercel for convenience).
-   **Database**: Neon (Serverless Postgres) for scalability and branching.
-   **Redis**: Upstash (Serverless Redis) for low-maintenance caching.
-   **CI/CD**: GitHub Actions for automated testing and deployment.
