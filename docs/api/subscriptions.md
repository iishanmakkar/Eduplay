# Subscriptions API

## Overview

Manage school subscriptions, including checkout, upgrades, and cancellations via Razorpay.

## Endpoints

### Initiate Checkout

Create a Razorpay order for a subscription plan.

- **URL**: `/api/subscriptions/checkout`
- **Method**: `POST`
- **Role**: `ADMIN`

**Request Body:**

```json
{
  "planId": "plan_..."
}
```

**Response:**

```json
{
  "orderId": "order_..."
}
```

### Cancel Subscription

Cancel the current school subscription at the end of the billing period.

- **URL**: `/api/subscriptions/cancel`
- **Method**: `POST`
- **Role**: `ADMIN`

### Get Billing History

Retrieve past invoices and transactions.

- **URL**: `/api/subscriptions/history`
- **Method**: `GET`
- **Role**: `ADMIN`

## Plans

- **STARTER**: Basic features, limited limits.
- **SCHOOL**: Higher limits, premium games.
- **DISTRICT**: Unlimited.

## Webhooks

We listen for Razorpay webhooks at `/api/subscriptions/webhook` to handle verifying payments and updating subscription status.
