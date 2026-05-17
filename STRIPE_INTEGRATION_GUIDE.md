# Stripe Integration Guide

## Overview

The ElderCare Advanced platform uses Stripe for payment processing with full support for:
- ✅ Payment intents
- ✅ Card payments
- ✅ Webhooks for payment events
- ✅ Invoice generation
- ✅ Refunds
- ✅ Payment history

---

## Setup

### 1. Get Stripe API Keys

1. Sign up at https://stripe.com
2. Go to Dashboard → Developers → API Keys
3. Copy your **Publishable Key** and **Secret Key**

**Test Mode Keys:**
- Publishable: `pk_test_...`
- Secret: `sk_test_...`

**Production Keys:**
- Publishable: `pk_live_...`
- Secret: `sk_live_...`

### 2. Configure Environment Variables

**Backend (.env):**
```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Frontend (.env):**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### 3. Set Up Webhooks

1. Go to Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://yourdomain.com/api/payments/webhook`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the **Webhook Secret** to your `.env`

---

## Test Cards

### Success Scenarios
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVV: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### Decline Scenarios
```
Insufficient Funds: 4000 0000 0000 9995
Card Declined: 4000 0000 0000 0002
Incorrect CVC: 4000 0000 0000 0127
Expired Card: 4000 0000 0000 0069
Processing Error: 4000 0000 0000 0119
```

### 3D Secure
```
Authentication Required: 4000 0027 6000 3184
```

---

## API Endpoints

### Get Stripe Configuration
```bash
GET /api/payments/config

Response:
{
  "publishableKey": "pk_test_..."
}
```

### Create Payment Intent
```bash
POST /api/payments/payment-intent
Authorization: Bearer {token}

Body:
{
  "amount": 5000,  // $50.00 in cents
  "currency": "usd",
  "bookingId": "booking-123",
  "metadata": {
    "serviceName": "24/7 Elder Care",
    "customerName": "John Doe",
    "customerEmail": "john@example.com"
  }
}

Response:
{
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx"
}
```

### Get Payment Intent
```bash
GET /api/payments/payment-intent/{id}
Authorization: Bearer {token}

Response:
{
  "id": "pi_xxx",
  "amount": 5000,
  "currency": "usd",
  "status": "succeeded",
  "created": 1234567890
}
```

### Get Payment History
```bash
GET /api/payments/history?userId={userId}&limit=10
Authorization: Bearer {token}

Response:
{
  "payments": [
    {
      "id": "pi_xxx",
      "amount": 5000,
      "currency": "usd",
      "status": "succeeded",
      "created": 1234567890,
      "metadata": {...}
    }
  ],
  "hasMore": true
}
```

### Request Refund
```bash
POST /api/payments/refund
Authorization: Bearer {token}

Body:
{
  "paymentIntentId": "pi_xxx",
  "amount": 5000,  // Optional: partial refund
  "reason": "requested_by_customer"
}

Response:
{
  "refundId": "re_xxx",
  "status": "succeeded",
  "amount": 5000
}
```

---

## Frontend Integration

### 1. Basic Payment Flow

```javascript
import bookingService from './services/booking.service';

// Step 1: Create payment intent on backend
const paymentIntent = await bookingService.createPaymentIntent({
  amount: 5000, // $50.00
  currency: 'usd',
  bookingId: booking.id,
  metadata: {
    serviceName: service.name,
    customerName: user.name,
    customerEmail: user.email
  }
});

// Step 2: Collect card details (handled by PaymentCheckout component)
// The component auto-formats card numbers and validates inputs

// Step 3: Confirm payment
// In production, use Stripe.js to tokenize card
// For now, backend handles the payment processing

// Step 4: Handle success
if (paymentIntent.status === 'succeeded') {
  // Show success message
  // Navigate to confirmation page
}
```

### 2. Using Stripe Elements (Recommended for Production)

```javascript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    // Create payment intent on backend
    const { clientSecret } = await createPaymentIntent();

    // Confirm payment with card element
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: customerName,
            email: customerEmail,
          },
        },
      }
    );

    if (error) {
      console.error(error);
    } else if (paymentIntent.status === 'succeeded') {
      console.log('Payment successful!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>
        Pay
      </button>
    </form>
  );
}

// Wrap with Elements provider
function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
}
```

---

## Webhook Handling

### Backend Webhook Endpoint

```typescript
@Post('webhook')
async handleWebhook(
  @Req() req: RawBodyRequest<Request>,
  @Headers('stripe-signature') signature: string,
) {
  const event = this.stripe.webhooks.constructEvent(
    req.rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Update booking status to CONFIRMED
      // Send confirmation email
      // Create invoice
      break;

    case 'payment_intent.payment_failed':
      // Update booking status to FAILED
      // Send failure notification
      break;

    case 'charge.refunded':
      // Update payment status to REFUNDED
      // Send refund confirmation
      break;
  }

  return { received: true };
}
```

### Testing Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or download from https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/payments/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```

---

## Security Best Practices

### 1. Server-Side Processing
✅ **Always create payment intents on the server**
- Never expose secret keys in frontend code
- Validate amounts on the backend
- Check user authorization before creating payments

### 2. Webhook Security
✅ **Verify webhook signatures**
```typescript
const event = stripe.webhooks.constructEvent(
  req.rawBody,
  signature,
  webhookSecret
);
```

### 3. Idempotency
✅ **Use idempotency keys for retries**
```typescript
await stripe.paymentIntents.create(
  { amount, currency },
  { idempotencyKey: bookingId }
);
```

### 4. Error Handling
✅ **Handle all error types gracefully**
```typescript
try {
  const paymentIntent = await stripe.paymentIntents.create(...);
} catch (error) {
  if (error.type === 'StripeCardError') {
    // Card declined - show user-friendly message
  } else if (error.type === 'StripeInvalidRequestError') {
    // Invalid parameters
  } else {
    // Other errors
  }
}
```

---

## Common Issues

### Issue: "No such payment_intent"
**Solution:** Ensure payment intent ID is correct and not expired

### Issue: "Invalid API Key"
**Solution:** Check that you're using the correct key (test vs live)

### Issue: "Webhook signature verification failed"
**Solution:** 
- Verify webhook secret is correct
- Ensure raw body is passed to verification
- Check that body parser is configured correctly

### Issue: "Card declined"
**Solution:** 
- Use test card numbers
- Check card details are correct
- Verify sufficient funds (for real cards)

---

## Monitoring & Analytics

### Stripe Dashboard
- View all payments: Dashboard → Payments
- Check failed payments: Dashboard → Payments → Failed
- Monitor disputes: Dashboard → Disputes
- Review analytics: Dashboard → Reports

### Custom Monitoring
```typescript
// Log payment attempts
logger.info('Payment initiated', {
  amount,
  currency,
  userId,
  bookingId
});

// Track success rate
const successRate = (succeeded / total) * 100;

// Monitor average payment time
const avgTime = totalTime / paymentCount;
```

---

## Production Checklist

- [ ] Use live API keys (pk_live_... and sk_live_...)
- [ ] Test webhooks in production environment
- [ ] Enable 3D Secure (SCA compliance)
- [ ] Set up email notifications for failed payments
- [ ] Configure Stripe Radar for fraud detection
- [ ] Enable payment method icons
- [ ] Test all payment scenarios
- [ ] Set up monitoring and alerts
- [ ] Review and accept Stripe Terms of Service
- [ ] Complete PCI compliance questionnaire

---

## Support

**Stripe Documentation:** https://stripe.com/docs  
**API Reference:** https://stripe.com/docs/api  
**Stripe CLI:** https://stripe.com/docs/stripe-cli  
**Community:** https://stackoverflow.com/questions/tagged/stripe-payments
