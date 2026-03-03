# 🎭 Demo Account Guide

## Quick Start

### Login to Demo Account

**Email**: `demo@eduplay.com`  
**Password**: Use magic link or SSO

### What's Included

The demo account comes pre-populated with realistic data:

#### 👨‍🏫 Demo Teacher Account
- Name: Demo Teacher
- Email: demo@eduplay.com
- XP: 5,000
- Current Streak: 15 days

#### 🎓 Demo Class: Grade 5A
- **10 Students** with varied performance levels
- **150+ Game Results** across all game types
- **Sample Assignment**: Weekly Math Challenge
- **Achievements** unlocked by top performers

#### 📊 Realistic Data
- Game results spanning last 30 days
- Accuracy ranging from 50% to 100%
- Multiple game types played
- Varied XP levels (1,000 - 10,000)
- Different streak lengths

---

## Demo Students

| Name | Email | XP Range | Performance |
|------|-------|----------|-------------|
| Alice Johnson | student1@demo.eduplay.com | High | Top performer |
| Bob Smith | student2@demo.eduplay.com | Medium | Average |
| Charlie Brown | student3@demo.eduplay.com | High | Consistent |
| Diana Prince | student4@demo.eduplay.com | Medium | Improving |
| Ethan Hunt | student5@demo.eduplay.com | Low | Needs support |
| Fiona Green | student6@demo.eduplay.com | High | Excellent |
| George Wilson | student7@demo.eduplay.com | Medium | Steady |
| Hannah Lee | student8@demo.eduplay.com | High | Star student |
| Isaac Newton | student9@demo.eduplay.com | Medium | Good effort |
| Julia Roberts | student10@demo.eduplay.com | High | Outstanding |

---

## How to Create Demo Account

Run the seed script:

```bash
npx tsx prisma/seed-demo-account.ts
```

This will create:
- ✅ 1 demo teacher account
- ✅ 1 demo class (Grade 5A)
- ✅ 10 demo students
- ✅ 150+ game results
- ✅ 3 sample achievements
- ✅ 1 active assignment

---

## Use Cases

### For Sales Demos
1. **Show teacher dashboard** with real student data
2. **Demonstrate analytics** with actual game results
3. **Display leaderboards** with competitive students
4. **Show assignment system** with active tasks

### For Testing
1. **Test new features** with realistic data
2. **Verify analytics calculations** with known data
3. **Check UI rendering** with varied student counts
4. **Validate game result tracking**

### For Screenshots/Marketing
1. **Capture dashboard views** with populated data
2. **Show progress charts** with real trends
3. **Display leaderboards** with competitive rankings
4. **Demonstrate assignment flow**

---

## Resetting Demo Data

To reset the demo account:

```bash
# Delete existing demo data
npx prisma studio
# Manually delete users with @demo.eduplay.com emails

# Re-run seed script
npx tsx prisma/seed-demo-account.ts
```

---

## Customizing Demo Data

Edit `prisma/seed-demo-account.ts` to:
- Change student names
- Adjust XP ranges
- Modify game result counts
- Add more classes
- Create different assignments

---

## Demo Account Features

### ✅ Available Features
- Full teacher dashboard
- Student progress tracking
- Analytics and reports
- Assignment creation
- Leaderboards
- Achievement system
- Class management

### ⚠️ Limitations
- Demo data only (not real students)
- Pre-populated game results
- Fixed time range (last 30 days)
- No real email notifications

---

## Tips for Demos

1. **Start with Dashboard**: Show overview metrics
2. **Highlight Top Students**: Alice, Fiona, Hannah
3. **Show Struggling Student**: Ethan (needs intervention)
4. **Demonstrate Assignment**: Weekly Math Challenge
5. **Display Analytics**: 30-day trends
6. **Show Leaderboard**: Competitive rankings

---

## Demo Scenarios

### Scenario 1: New Teacher Onboarding
"Welcome! Here's what your dashboard looks like with an active class..."

### Scenario 2: Progress Monitoring
"Let's check how Alice is performing across different cognitive skills..."

### Scenario 3: Intervention Planning
"I notice Ethan is struggling. Let's create a targeted assignment..."

### Scenario 4: Parent Communication
"Here's the progress report you can share with parents..."

---

**The demo account is perfect for showcasing EduPlay Pro's full capabilities! 🚀**
