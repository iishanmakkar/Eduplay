# Database Entity-Relationship Diagram

The following diagram represents the core data models and their relationships in the EduPlay Pro database.

```mermaid
erDiagram
    School ||--|{ User : "has members"
    School ||--|{ Class : "has classes"
    School ||--|| Subscription : "has plan"
    
    User ||--|{ Class : "teaches/enrolls"
    User ||--|{ Assignment : "creates/receives"
    User ||--|{ GameResult : "plays"
    User ||--|{ Badge : "earns"
    User ||--|{ AuditLog : "generates"
    
    Class ||--|{ Assignment : "contains"
    Class ||--|{ ClassStudent : "enrolls"
    
    Assignment ||--|{ GameResult : "has results"
    
    User {
        string id PK
        string email
        string role "ADMIN | TEACHER | STUDENT"
        string schoolId FK
    }
    
    School {
        string id PK
        string name
        string domain
    }
    
    Class {
        string id PK
        string name
        string grade
        string classCode
        string teacherId FK
    }
    
    Subscription {
        string id PK
        string status
        string plan "STARTER | SCHOOL | DISTRICT"
        date currentPeriodEnd
    }
    
    GameResult {
        string id PK
        string gameType
        int score
        int xpEarned
        string studentId FK
    }
```
