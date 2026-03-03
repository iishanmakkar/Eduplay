# EduPlay Pro API Documentation

Welcome to the EduPlay Pro API documentation. This API allows you to integrate with the EduPlay platform to manage schools, users, classes, assignments, and game results.

## Base URL

All API requests should be made to:

```
https://eduplay-saas.com/api
```

## Authentication

The API uses session-based authentication via NextAuth.js. Most endpoints require a valid session cookie.

See [Authentication](./authentication.md) for more details.

## Response Format

All API responses are in JSON format.

```json
{
  "success": true,
  "data": { ... }
}
```

Or for errors:

```json
{
  "error": "Error message description"
}
```

## Rate Limiting

API routes are rate-limited to ensure stability:
- **General API**: 100 requests per minute
- **Authentication**: 10 requests per minute
- **Heavy Operations**: 30 requests per minute

## Resources

- [Authentication](./authentication.md)
- [Classes](./classes.md)
- [Assignments](./assignments.md)
- [Games & Results](./games.md)
- [Subscriptions](./subscriptions.md)
