# 🚀 EduPlay SaaS - Complete Deployment Guide

## Quick Start (5 Minutes)

### Step 1: Database Setup

**Option A: Railway (Recommended)**
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Provision PostgreSQL"
3. Copy the `DATABASE_URL` from the Connect tab

**Option B: Supabase**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database → Connection String
4. Copy the URI (use Transaction mode)

**Option C: Local PostgreSQL**
```bash
# Install PostgreSQL, then:
createdb eduplay
# DATABASE_URL="postgresql://localhost:5432/eduplay"
```

### Step 2: Clone and Configure

```bash
cd d:\school\eduplay-saas
npm install

# Copy environment template
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="your-postgres-url-from-step-1"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
```

### Step 3: Initialize Database

```bash
npx prisma db push
npx prisma db seed
```

You should see:
```
✅ Created school: Riverside Primary School
✅ Created admin: admin@riverside.edu
✅ Created teacher: teacher@riverside.edu
✅ Created student: student@riverside.edu
```

### Step 4: Run Locally

```bash
npm run dev
```

Open http://localhost:3000

**Test with demo accounts:**
- Admin: `admin@riverside.edu` / `password123`
- Teacher: `teacher@riverside.edu` / `password123`
- Student: `student@riverside.edu` / `password123`

---

## Production Deployment

### 1. Stripe Setup

#### Create Stripe Account
1. Sign up at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard → Developers → API keys

#### Create Products
1. Go to Products → Add Product
2. Create 3 products:

**Starter Plan**
- Name: EduPlay Starter
- Price: $49/month
- Copy the Price ID (starts with `price_`)

**School Plan**
- Name: EduPlay School
- Price: $199/month
- Copy the Price ID

**District Plan**
- Name: EduPlay District
- Price: $599/month
- Copy the Price ID

#### Add to `.env`:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_STARTER_PRICE_ID="price_..."
STRIPE_SCHOOL_PRICE_ID="price_..."
STRIPE_DISTRICT_PRICE_ID="price_..."
```

### 2. Deploy to Vercel

#### Via GitHub (Recommended)
1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/eduplay-saas.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repo
5. Add environment variables (copy from `.env`)
6. Click "Deploy"

#### Via Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

Add environment variables in Vercel dashboard.

### 3. Configure Stripe Webhook

After deploying to Vercel:

1. Go to Stripe Dashboard → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-app.vercel.app/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Add to Vercel environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
8. Redeploy: `vercel --prod`

### 4. Test Production

1. Go to your deployed URL
2. Sign up with a new account
3. Create a class (if teacher)
4. Test subscription upgrade:
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any CVC
5. Verify webhook in Stripe Dashboard → Webhooks → Events

---

## Environment Variables Reference

### Required for Development
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

### Required for Production
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_STARTER_PRICE_ID="price_..."
STRIPE_SCHOOL_PRICE_ID="price_..."
STRIPE_DISTRICT_PRICE_ID="price_..."
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Monitoring
SENTRY_DSN="https://..."
NEXT_PUBLIC_SENTRY_DSN="https://..."
```

### Optional (Email notifications)
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

---

## Post-Deployment Checklist

- [ ] Database is accessible from Vercel
- [ ] All environment variables are set
- [ ] Stripe webhook is configured and receiving events
- [ ] Demo accounts work (sign in with seeded credentials)
- [ ] Can create new account
- [ ] Can create a class (teacher)
- [ ] Can join a class (student)
- [ ] Can play a game
- [ ] Verify XP and Level progress updates
- [ ] Verify Streaks and Badge unlocks
- [ ] Can upgrade subscription (test mode)
- [ ] Webhook updates subscription status

---

## Troubleshooting

### "Prisma Client not found"
```bash
npx prisma generate
npm run build
```

### Database connection fails
- Check `DATABASE_URL` is correct
- Ensure database allows connections from Vercel IPs
- For Supabase: use "Transaction" mode connection string

### Stripe webhook not working
- Verify webhook URL is correct
- Check webhook secret matches
- View webhook logs in Stripe Dashboard
- Ensure endpoint is deployed (not localhost)

### NextAuth session issues
- Regenerate `NEXTAUTH_SECRET`
- Clear browser cookies
- Check `NEXTAUTH_URL` matches your domain

### Build fails on Vercel
- Run `npm run build` locally first
- Check TypeScript errors
- Ensure all dependencies are in `package.json`

---

## Monitoring & Maintenance

### Vercel Analytics
Enable in Vercel dashboard → Analytics

### Database Monitoring
- Railway: Built-in metrics
- Supabase: Database → Reports

### Stripe Dashboard
- Monitor subscriptions
- Check webhook delivery
- View failed payments

### Weekly Tasks
- Check error logs in Vercel
- Review Stripe webhook logs
- Monitor database size

---

## Scaling

### When you hit 100+ schools:

1. **Database**
   - Upgrade to larger instance
   - Add read replicas
   - Implement connection pooling (PgBouncer)

2. **Caching**
   - Add Redis for leaderboard
   - Cache analytics queries
   - Use Vercel Edge Config

3. **CDN**
   - Enable Vercel Edge Network
   - Optimize images with Next/Image

4. **Monitoring**
   - Add Sentry for error tracking
   - Implement PostHog for analytics
   - Set up Datadog for APM

---

## Going Live Checklist

- [ ] Switch Stripe to live mode
- [ ] Update Stripe keys to `pk_live_` and `sk_live_`
- [ ] Configure production webhook
- [ ] Set up custom domain
- [ ] Enable SSL (automatic on Vercel)
- [ ] Add privacy policy page
- [ ] Add terms of service page
- [ ] Set up customer support email
- [ ] Create onboarding email templates
- [ ] Test full user journey
- [ ] Set up monitoring alerts

---

## Support

For deployment issues:
- Check Vercel logs: `vercel logs`
- Check Prisma logs: Enable in `lib/prisma.ts`
- Check Stripe webhook logs in dashboard

**Your app is now production-ready! 🎉**
