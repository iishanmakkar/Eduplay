# Database Migration Guide

EduPlay Pro uses Prisma Migrate for database schema management.

## Routine Migrations

When deploying changes to the schema:

1.  **Generate Migration**:
    ```bash
    npx prisma migrate dev --name describe_changes
    ```

2.  **Apply in Production**:
    During the build/deploy phase, run:
    ```bash
    npx prisma migrate deploy
    ```

## Data Seeding

To seed the database with initial plans and admin users:

```bash
npx prisma db seed
```

This runs the script at `prisma/seed.ts`.

## Disaster Recovery

If the database is corrupted:

1.  Restore from the latest Neon backup.
2.  Verify integrity of recent transactions via Stripe/Razorpay reconciliation.
