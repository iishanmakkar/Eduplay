# Data Flow Diagram

This diagram illustrates how data flows through the system during key user interactions, such as a student playing a game.

```mermaid
sequenceDiagram
    participant Student
    participant UI as Web Interface
    participant API as API Route
    participant Auth as NextAuth
    participant DB as Database
    participant Cache as Redis
    
    Student->>UI: Plays Game
    UI->>API: POST /api/games/save-result
    
    API->>Auth: Validate Session
    Auth-->>API: Session Valid (Student)
    
    API->>Cache: Check Rate Limit
    Cache-->>API: Allowed
    
    API->>DB: Calculate XP & Streak
    DB-->>API: Updated Stats
    
    API->>DB: Save GameResult
    DB-->>API: Success
    
    API-->>UI: Return XP & Badges
    UI-->>Student: Show Success Animation
```

## Critical Flows

1.  **Authentication**: Secure session creation and validation on every protected request.
2.  **Game Submission**: Validation, rate limiting, XP calculation, and persistence.
3.  **Analytics**: Asynchronous aggregation of data for admin dashboards (cached).
