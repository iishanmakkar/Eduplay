# CDN Setup

Serve static assets closer to users to reduce latency.

## Static Assets

Next.js automatically optimizes images and fonts.

-   **Images**: Use `next/image` to serve WebP/AVIF formats sized for the device.
-   **Fonts**: Use `next/font` to self-host and preload Google Fonts.

## Dynamic Content

For global classrooms, consider enabling:

-   **Edge Middleware**: Execute simple logic (redirects, auth checks) at the edge.
-   **Database Regional Replication**: Place read replicas in regions with high user density (e.g., US East, Europe West).
