# Authentication API

## Overview

EduPlay Pro uses NextAuth.js for authentication. It supports credential-based login (Email/Password).

## Endpoints

### Sign In

Initiates a session for a user.

- **URL**: `/api/auth/signin`
- **Method**: `POST`
- **Content-Type**: `application/json`

**Request Body:**

```json
{
  "email": "teacher@school.com",
  "password": "secure_password",
  "csrfToken": "..."
}
```

**Response:**

A session cookie is set upon successful authentication.

### Sign Out

Terminates the current session.

- **URL**: `/api/auth/signout`
- **Method**: `POST`

### Get Session

Retrieves the current user session.

- **URL**: `/api/auth/session`
- **Method**: `GET`

**Response:**

```json
{
  "user": {
    "name": "Jane Doe",
    "email": "teacher@school.com",
    "image": null,
    "role": "TEACHER",
    "schoolId": "cmfd..."
  },
  "expires": "2024-03-14T12:00:00.000Z"
}
```

## Roles

Users have one of the following roles:
- `ADMIN`: School administrator, manages subscription and teachers.
- `TEACHER`: Manages classes and assignments.
- `STUDENT`: Joins classes and plays games.

## Rate Limits

Authentication endpoints are strictly rate-limited to **10 requests per minute** to prevent brute-force attacks.
