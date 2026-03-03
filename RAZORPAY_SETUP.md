# 🇮🇳 Razorpay Integration Guide

## Quick Setup (5 Minutes)

### 1. Create Razorpay Account
1. Go to [razorpay.com](https://razorpay.com)
2. Sign up and complete KYC
3. Go to Dashboard → Settings → API Keys
4. Generate Test/Live Keys

### 2. Create Subscription Plans

Go to Dashboard → Subscriptions → Plans

**Plan 1: Starter**
- Plan Name: `EduPlay Starter`
- Billing Amount: `₹3,999`
- Billing Interval: `1 month`
- Copy the Plan ID (starts with `plan_`)

**Plan 2: School**
- Plan Name: `EduPlay School`
- Billing Amount: `₹15,999`
- Billing Interval: `1 month`
- Copy the Plan ID

**Plan 3: District**
- Plan Name: `EduPlay District`
- Billing Amount: `₹47,999`
- Billing Interval: `1 month`
- Copy the Plan ID

### 3. Update `.env` File

```env
# Razorpay Keys
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxx"
RAZORPAY_KEY_ID="rzp_test_xxxxx"
RAZORPAY_KEY_SECRET="your_secret_key"

# Plan IDs from step 2
RAZORPAY_STARTER_PLAN_ID="plan_xxxxx"
RAZORPAY_SCHOOL_PLAN_ID="plan_xxxxx"
RAZORPAY_DISTRICT_PLAN_ID="plan_xxxxx"
```

### 4. Set Up Webhook (After Deployment)

1. Deploy your app to Vercel
2. Go to Razorpay Dashboard → Webhooks
3. Add webhook URL: `https://your-domain.vercel.app/api/webhooks/razorpay`
4. Select events:
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
   - `subscription.paused`
   - `subscription.halted`
   - `subscription.completed`
5. Copy the webhook secret
6. Add to `.env`:
   ```env
   RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"
   ```

---

## Testing Subscription Flow

### Test Mode
Razorpay automatically provides test mode. Use test keys (starting with `rzp_test_`).

### Create Subscription
1. Sign in as Admin
2. Go to Admin Dashboard
3. Click "Upgrade Plan"
4. Select a plan
5. Complete payment using test card details

### Test Cards
Razorpay provides test cards in their dashboard. Common ones:
- **Success**: Any valid card number (e.g., `4111 1111 1111 1111`)
- **Failure**: Use specific test cards from Razorpay docs

---

## API Routes Created

### `/api/razorpay/create-subscription`
**Method**: POST  
**Auth**: Admin only  
**Body**:
```json
{
  "plan": "STARTER" | "SCHOOL" | "DISTRICT"
}
```
**Response**:
```json
{
  "subscriptionId": "sub_xxxxx",
  "customerId": "cust_xxxxx",
  "shortUrl": "https://rzp.io/i/xxxxx"
}
```

### `/api/webhooks/razorpay`
**Method**: POST  
**Headers**: `x-razorpay-signature`  
**Handles**: All subscription lifecycle events

---

## Pricing Comparison

| Plan | Monthly (INR) | Monthly (USD) |
|------|--------------|---------------|
| Starter | ₹3,999 | ~$49 |
| School | ₹15,999 | ~$199 |
| District | ₹47,999 | ~$599 |

---

## Going Live

### Switch to Live Mode
1. Complete KYC in Razorpay
2. Get live API keys (start with `rzp_live_`)
3. Create live subscription plans
4. Update `.env` with live keys
5. Update webhook URL to production domain

### Checklist
- [ ] KYC completed
- [ ] Live API keys generated
- [ ] Live subscription plans created
- [ ] Environment variables updated
- [ ] Webhook configured for production
- [ ] Test payment flow end-to-end
- [ ] Verify webhook events are received

---

## Differences from Stripe

**Advantages:**
- ✅ Better for Indian market
- ✅ Lower transaction fees (2% vs 2.9%)
- ✅ UPI, Netbanking, Cards support
- ✅ Instant settlements
- ✅ INR native

**Considerations:**
- Subscription management is simpler
- Webhook events have different names
- Customer portal is less feature-rich
- International cards may have higher fees

---

## Troubleshooting

### Webhook not receiving events
- Check webhook URL is correct
- Verify webhook secret matches
- Check Razorpay Dashboard → Webhooks → Logs
- Ensure app is deployed (not localhost)

### Subscription creation fails
- Verify plan IDs are correct
- Check API keys are valid
- Ensure customer email is valid
- Check Razorpay Dashboard → Logs

### Payment fails
- Use test mode for development
- Check card details are correct
- Verify plan amount matches
- Check Razorpay account is active

---

## Support

**Razorpay Docs**: [razorpay.com/docs](https://razorpay.com/docs)  
**Support**: support@razorpay.com  
**Dashboard**: [dashboard.razorpay.com](https://dashboard.razorpay.com)

---

**Your Razorpay integration is ready! 🎉**
