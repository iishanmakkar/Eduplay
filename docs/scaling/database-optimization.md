# Database Optimization

Strategies to maintain sub-200ms response times as data grows.

## Indexing

Ensure high-traffic query patterns are indexed.

-   **Composite Indexes**: For queries filtering by multiple fields (e.g., `[schoolId, createdAt]`).
-   **Covering Indexes**: Include frequently selected columns in the index to avoid table lookups.

## Query Optimization

-   **Filtering**: Always filter by indexed columns (`where`).
-   **Pagination**: Use cursor-based pagination for large lists (`take`, `skip`, `cursor`) instead of offset pagination.
-   **Select**: Only select the fields needed (`select: { id: true, name: true }`) to reduce payload size.

## Archiving

-   **Audit Logs**: Move logs older than 90 days to cold storage (e.g., S3 CSV) and delete from Postgres to keep the table light.
-   **Game Results**: Summarize historical data into `DailyMetrics` and archive raw results periodically.
