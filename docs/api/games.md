# Games API

## Overview

Submit game results, track XP, and manage leaderboards.

## Endpoints

### Save Game Result

Submit a game session result.

- **URL**: `/api/games/save-result`
- **Method**: `POST`
- **Role**: `STUDENT`

**Request Body:**

```json
{
  "gameType": "SPEED_MATH",
  "score": 1500,
  "accuracy": 0.95,
  "timeSpent": 120, // seconds
  "assignmentId": "as..." // optional
}
```

**Response:**

```json
{
  "success": true,
  "xpEarned": 150,
  "gameResult": { ... }
}
```

### Get Leaderboard

Retrieve the top students by XP for the current week.

- **URL**: `/api/leaderboard`
- **Method**: `GET`
- **Role**: Any authenticated user

**Response:**

```json
[
  {
    "rank": 1,
    "studentName": "Alex S.",
    "weeklyXP": 5400
  },
  ...
]
```

## Security

Game result submissions are rate-limited to **30 requests per minute** to prevent automated farming.
