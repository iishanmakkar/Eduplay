# 🏫 EduPlay SaaS - Production-Ready Educational Platform

A complete, full-stack SaaS application for schools with gamified learning, role-based dashboards, Stripe subscriptions, and real-time analytics.

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Stripe Subscriptions
- **Deployment**: Vercel + Railway/Supabase

## ✨ Features

### Multi-Role System
- **Teachers**: Create classes, assign games, track student progress
- **Students**: Play games, earn XP/badges, maintain streaks
- **Admins**: School-wide analytics, billing management

### Educational Games
- Speed Math (timed arithmetic)
- Science Quiz (multiple choice)
- World Flags (geography)
- Memory Match (card game)
- Logic Puzzles (riddles & reasoning)
- Pattern Master (sequences)
- Word Scramble (educational vocab)
- Typing Speed & Tutor (master the keyboard)
- Memory Matrix & Grid (spatial memory)
- Code Breaker (logical deduction)
- + Many more brain-boost games

### SaaS Features
- Stripe subscription management (3 plans)
- Role-based access control
- Real-time analytics & charts
- PDF report generation
- Leaderboard system with weekly reset
- XP & leveling system
- Badge achievements
- Streak tracking

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Stripe account

### 1. Clone and Install

```bash
cd eduplay-saas
npm install
```

### 2. Database Setup

Create a PostgreSQL database (use Railway, Supabase, or local):

```bash
# Copy environment variables
cp .env.example .env

# Edit .env and add your DATABASE_URL
# Example: postgresql://user:password@localhost:5432/eduplay
```

Push schema and seed database:

```bash
npx prisma db push
npx prisma db seed
```

### 3. Configure Environment Variables

Edit `.env`:

```env
DATABASE_URL="your-postgres-url"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# Stripe (get from https://dashboard.stripe.com)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..." # After setting up webhook

# Create products in Stripe and add price IDs
STRIPE_STARTER_PRICE_ID="price_..."
STRIPE_SCHOOL_PRICE_ID="price_..."
STRIPE_DISTRICT_PRICE_ID="price_..."
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🧪 Demo Credentials

After seeding, use these credentials:

- **Admin**: `admin@riverside.edu` / `password123`
- **Teacher**: `teacher@riverside.edu` / `password123`
- **Student**: `student@riverside.edu` / `password123`

## 🚢 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
vercel --prod
```

### Database (Railway)

1. Create PostgreSQL database at [railway.app](https://railway.app)
2. Copy `DATABASE_URL` to Vercel environment variables
3. Run migrations:

```bash
npx prisma db push
npx prisma db seed
```

### Stripe Webhook Setup

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### Stripe Products Setup

1. Create 3 products in Stripe Dashboard:
   - **Starter** - $49/month
   - **School** - $199/month
   - **District** - $599/month
2. Copy price IDs to environment variables

## 📁 Project Structure

```
eduplay-saas/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication
│   │   ├── classes/      # Class management
│   │   ├── games/        # Game submission
│   │   ├── stripe/       # Stripe checkout
│   │   └── webhooks/     # Stripe webhooks
│   ├── auth/             # Auth pages (signin/signup)
│   ├── dashboard/        # Role-based dashboards
│   │   ├── teacher/      # Teacher dashboard
│   │   ├── student/      # Student portal
│   │   └── admin/        # Admin panel
│   ├── games/            # Playable games
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/           # Reusable React components
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   ├── stripe.ts         # Stripe configuration
│   └── utils.ts          # Utility functions
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
├── middleware.ts         # Route protection
└── package.json
```

## 🎮 Game Implementation

Each game follows this pattern:

1. Track score, accuracy, time
2. Submit to `/api/games/save-result`
3. Calculate XP automatically via `GamificationEngine`
4. Award badges based on performance
5. Update student streak and level

Example game submission:

```typescript
const response = await fetch('/api/games/save-result', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    matchId: 'unique-idempotency-key',
    gameType: 'SPEED_MATH',
    score: 850,
    accuracy: 0.85,
    timeSpent: 120,
  }),
})
const data = await response.json()
// Returns { success, xpEarned, newLevel, levelUp, unlockedBadges, ... }
```

## 💳 Subscription Flow

1. Admin clicks "Upgrade Plan"
2. API creates Stripe checkout session
3. User completes payment on Stripe
4. Webhook updates subscription in database
5. User redirected back to dashboard

## 📊 Analytics

- **Teacher Dashboard**: Weekly activity, game popularity, student attention list
- **Admin Dashboard**: School-wide metrics, teacher engagement, revenue tracking
- **Student Portal**: XP progress, subject breakdown, class rank

## 🔒 Security

- Passwords hashed with bcrypt (10 rounds)
- JWT-based sessions with NextAuth
- Role-based route protection via middleware
- Stripe webhook signature verification
- Input validation with Zod
- SQL injection protection via Prisma

## 🧪 Testing

```bash
# Run type checking
npm run build

# Test authentication flow
# 1. Sign up new user
# 2. Sign in
# 3. Check role-based redirect

# Test subscription
# Use Stripe test card: 4242 4242 4242 4242
```

## 📈 Scaling Considerations

- **Database**: Add read replicas for analytics queries
- **Caching**: Implement Redis for leaderboard/stats
- **CDN**: Use Vercel Edge for static assets
- **Monitoring**: Add Sentry for error tracking
- **Analytics**: Implement PostHog or Mixpanel

## 🛠️ Maintenance

### Weekly Tasks
- Reset leaderboard (runs automatically via cron)
- Check subscription statuses
- Monitor Stripe webhook logs

### Monthly Tasks
- Review analytics
- Update game question banks
- Security updates

## 📝 License

MIT License - feel free to use for your own projects!

## 🤝 Support

For issues or questions:
- Check the implementation plan in `/brain/implementation_plan.md`
- Review API routes in `/app/api`
- Check Prisma schema for data structure

---

**Built with ❤️ for teachers and students everywhere**
