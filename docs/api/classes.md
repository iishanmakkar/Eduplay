# Classes API

## Overview

Manage classes, including creating new classes, enrolling students, and retrieving class details.

## Endpoints

### Create Class

Create a new class for a teacher.

- **URL**: `/api/classes/create`
- **Method**: `POST`
- **Role**: `TEACHER`

**Request Body:**

```json
{
  "name": "Math Grade 5",
  "grade": "5",
  "subject": "MATH",
  "emoji": "📐"
}
```

**Response:**

```json
{
  "success": true,
  "class": {
    "id": "cl...",
    "name": "Math Grade 5",
    "classCode": "X7K9P2",
    "createdAt": "2024-03-14T..."
  }
}
```

### Join Class

Enrolls a student in a class using a class code.

- **URL**: `/api/classes/join`
- **Method**: `POST`
- **Role**: `STUDENT`

**Request Body:**

```json
{
  "classCode": "X7K9P2"
}
```

### Get Class Details

Retrieve detailed information about a class, including students and assignments.

- **URL**: `/api/classes/[id]`
- **Method**: `GET`
- **Role**: `TEACHER` (owner) or `STUDENT` (enrolled)

## Limits

Class creation is subject to plan limits:
- **Starter**: 3 classes
- **School**: 15 classes
- **District**: Unlimited
