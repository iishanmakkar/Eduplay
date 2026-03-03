# Assignments API

## Overview

Manage assignments for classes. Teachers can create assignments, and students can view their pending work.

## Endpoints

### Create Assignment

Create a new assignment for a class.

- **URL**: `/api/assignments/create`
- **Method**: `POST`
- **Role**: `TEACHER`

**Request Body:**

```json
{
  "classId": "cl...",
  "title": "Algebra Basics",
  "description": "Complete the speed math challenge.",
  "gameType": "SPEED_MATH",
  "dueDate": "2024-03-20T23:59:59Z"
}
```

### Get Pending Assignments

Retrieve all pending assignments for the logged-in student.

- **URL**: `/api/assignments/pending`
- **Method**: `GET`
- **Role**: `STUDENT`

**Response:**

```json
[
  {
    "id": "as...",
    "title": "Algebra Basics",
    "gameType": "SPEED_MATH",
    "dueDate": "2024-03-20T...",
    "class": {
      "name": "Math Grade 5"
    }
  }
]
```

## Integration

Assignments are automatically marked as completed when a student plays the specified game type and achieves a passing score (if applicable).
