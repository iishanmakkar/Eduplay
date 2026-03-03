# EduPlay Pro API Documentation

## Base URL
```
Production: https://api.eduplay.com/v1
Development: http://localhost:3000/api/v1
```

## Authentication

All API requests require an API key passed in the `X-API-Key` header:

```bash
curl -H "X-API-Key: epk_your_api_key_here" \
  https://api.eduplay.com/v1/students
```

### Getting an API Key

1. Log in to your EduPlay Pro account
2. Go to Settings → API Access
3. Click "Generate New API Key"
4. Copy and securely store your API key

**Important**: API keys are shown only once. Store them securely.

---

## Rate Limiting

- Default: 1000 requests per hour per API key
- Rate limit info is returned in response headers:
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

---

## Endpoints

### Students

#### List Students
```http
GET /api/v1/students
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `classId` (string): Filter by class ID
- `email` (string): Filter by email (partial match)
- `name` (string): Filter by name (partial match)
- `sortBy` (string): Sort field (name, email, createdAt)
- `sortOrder` (string): Sort direction (asc, desc)

**Example Request:**
```bash
curl -H "X-API-Key: epk_xxx" \
  "https://api.eduplay.com/v1/students?page=1&limit=20&classId=cls_123"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "usr_123",
      "email": "student@school.com",
      "name": "John Doe",
      "image": null,
      "createdAt": "2024-01-15T10:30:00Z",
      "classStudents": [
        {
          "class": {
            "id": "cls_123",
            "name": "Grade 5A"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Create Student
```http
POST /api/v1/students
```

**Request Body:**
```json
{
  "email": "newstudent@school.com",
  "name": "Jane Smith",
  "classId": "cls_123"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "usr_456",
    "email": "newstudent@school.com",
    "name": "Jane Smith",
    "createdAt": "2024-02-13T12:00:00Z"
  }
}
```

#### Get Student Progress
```http
GET /api/v1/students/:id/progress
```

**Example Response:**
```json
{
  "data": {
    "student": {
      "id": "usr_123",
      "name": "John Doe",
      "email": "student@school.com",
      "classes": [
        {
          "id": "cls_123",
          "name": "Grade 5A"
        }
      ]
    },
    "stats": {
      "totalGames": 145,
      "totalXP": 12450,
      "avgAccuracy": 0.87,
      "currentStreak": 7,
      "longestStreak": 15,
      "lastActive": "2024-02-13T10:30:00Z"
    },
    "gamesByType": {
      "SPEED_MATH": {
        "count": 25,
        "avgScore": 850,
        "avgAccuracy": 0.92,
        "totalXP": 2100
      },
      "CODE_BREAKER": {
        "count": 15,
        "avgScore": 720,
        "avgAccuracy": 0.85,
        "totalXP": 1500
      }
    },
    "recentGames": [...],
    "achievements": [...]
  }
}
```

---

### Analytics

#### Get Overview Analytics
```http
GET /api/v1/analytics/overview
```

**Query Parameters:**
- `startDate` (ISO 8601): Start date for analytics (default: 30 days ago)
- `endDate` (ISO 8601): End date for analytics (default: today)

**Example Request:**
```bash
curl -H "X-API-Key: epk_xxx" \
  "https://api.eduplay.com/v1/analytics/overview?startDate=2024-01-01&endDate=2024-02-13"
```

**Example Response:**
```json
{
  "data": {
    "overview": {
      "totalStudents": 120,
      "activeStudents": 95,
      "engagementRate": 79,
      "totalGamesPlayed": 3450,
      "totalXPEarned": 287500,
      "avgAccuracy": 84.5
    },
    "gamesByType": {
      "SPEED_MATH": 450,
      "CODE_BREAKER": 320,
      "VISUAL_ROTATION": 280
    },
    "dailyActivity": [
      {
        "date": "2024-02-01",
        "games": 125,
        "activeStudents": 45
      },
      {
        "date": "2024-02-02",
        "games": 138,
        "activeStudents": 52
      }
    ],
    "dateRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-02-13T23:59:59Z"
    }
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "message": "Invalid API key",
    "code": "UNAUTHORIZED",
    "timestamp": "2024-02-13T12:00:00Z"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `MISSING_FIELDS` | 400 | Required fields missing |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Webhooks

Subscribe to events in your EduPlay Pro account:

### Available Events
- `student.created` - New student added
- `game.completed` - Student completed a game
- `achievement.unlocked` - Student unlocked achievement
- `assignment.submitted` - Student submitted assignment

### Webhook Payload Example
```json
{
  "event": "game.completed",
  "timestamp": "2024-02-13T12:00:00Z",
  "data": {
    "studentId": "usr_123",
    "gameType": "CODE_BREAKER",
    "score": 850,
    "xpEarned": 120
  }
}
```

---

## Code Examples

### Python
```python
import requests

API_KEY = "epk_your_api_key"
BASE_URL = "https://api.eduplay.com/v1"

headers = {
    "X-API-Key": API_KEY
}

# List students
response = requests.get(f"{BASE_URL}/students", headers=headers)
students = response.json()

# Get student progress
student_id = "usr_123"
response = requests.get(f"{BASE_URL}/students/{student_id}/progress", headers=headers)
progress = response.json()
```

### JavaScript/Node.js
```javascript
const API_KEY = 'epk_your_api_key';
const BASE_URL = 'https://api.eduplay.com/v1';

// List students
const response = await fetch(`${BASE_URL}/students`, {
  headers: {
    'X-API-Key': API_KEY
  }
});
const students = await response.json();

// Create student
const newStudent = await fetch(`${BASE_URL}/students`, {
  method: 'POST',
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'student@school.com',
    name: 'John Doe',
    classId: 'cls_123'
  })
});
```

---

## Support

- **Documentation**: https://docs.eduplay.com
- **Email**: api@eduplay.com
- **Status**: https://status.eduplay.com
