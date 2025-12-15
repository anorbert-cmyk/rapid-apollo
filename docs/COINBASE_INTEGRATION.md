# Coinbase Commerce Integration Guide

## Overview

This document outlines the steps needed to integrate Coinbase Commerce payment functionality into the rapid-apollo application for cryptocurrency payments.

## Current Status

⚠️ **Not Implemented** - Currently only placeholder `alert()` messages exist in `index.html`. No actual payment processing is configured.

## Prerequisites

1. **Coinbase Commerce Account**
   - Sign up at [commerce.coinbase.com](https://commerce.coinbase.com)
   - Complete KYC verification
   - Generate API keys

2. **API Keys Required**
   - API Key (for server-side operations)
   - Webhook Shared Secret (for payment verification)

## Implementation Steps

### 1. Install Coinbase Commerce SDK

```bash
npm install @coinbase/coinbase-commerce-node
```

### 2. Environment Variables

Add to your `.env` file:

```env
COINBASE_COMMERCE_API_KEY=your_api_key_here
COINBASE_WEBHOOK_SECRET=your_webhook_secret_here
COINBASE_REDIRECT_URL=https://your-domain.com/payment-success
```

### 3. Backend Integration

Create a new server endpoint for payment creation:

**File: `src/api/payment.js`** (or similar)

```javascript
const coinbase = require('@coinbase/coinbase-commerce-node');
const Client = coinbase.Client;

// Initialize client
Client.init(process.env.COINBASE_COMMERCE_API_KEY);

const Charge = coinbase.resources.Charge;

async function createCryptoCharge(tier, walletAddress) {
  try {
    const chargeData = {
      name: `Rapid Apollo - ${tier} Tier`,
      description: `Payment for ${tier} tier subscription`,
      local_price: {
        amount: getPriceForTier(tier), // e.g., "99.00"
        currency: 'USD'
      },
      pricing_type: 'fixed_price',
      metadata: {
        customer_wallet: walletAddress,
        tier: tier,
        timestamp: Date.now()
      },
      redirect_url: process.env.COINBASE_REDIRECT_URL,
      cancel_url: 'https://your-domain.com/payment-cancelled'
    };

    const charge = await Charge.create(chargeData);
    return {
      success: true,
      hosted_url: charge.hosted_url,
      charge_id: charge.id,
      code: charge.code
    };
  } catch (error) {
    console.error('Coinbase charge creation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function getPriceForTier(tier) {
  const prices = {
    'explorer': '99.00',
    'builder': '249.00',
    'architect': '499.00'
  };
  return prices[tier.toLowerCase()] || '99.00';
}

module.exports = { createCryptoCharge };
```

### 4. API Endpoint

Create an Express endpoint to handle charge creation:

```javascript
// In your Express app
app.post('/api/create-crypto-payment', async (req, res) => {
  const { tier, walletAddress } = req.body;
  
  if (!tier || !walletAddress) {
    return res.status(400).json({ 
      error: 'Missing tier or wallet address' 
    });
  }

  const result = await createCryptoCharge(tier, walletAddress);
  res.json(result);
});
```

### 5. Frontend Integration

Replace the placeholder alerts in `index.html` with actual payment flow:

```javascript
// In public/js/modules/wallet.js or similar

async function handleCryptoPayment(tier) {
  const walletAddress = getConnectedWallet(); // Get from wallet connection
  
  if (!walletAddress) {
    alert('Please connect your wallet first');
    return;
  }

  try {
    // Show loading state
    showLoadingSpinner();

    // Create charge via your backend
    const response = await fetch('/api/create-crypto-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tier: tier,
        walletAddress: walletAddress
      })
    });

    const data = await response.json();

    if (data.success) {
      // Redirect to Coinbase Commerce hosted page
      window.location.href = data.hosted_url;
    } else {
      alert('Payment creation failed: ' + data.error);
    }
  } catch (error) {
    console.error('Payment error:', error);
    alert('Payment failed. Please try again.');
  } finally {
    hideLoadingSpinner();
  }
}

// Update the button click handlers in index.html
function initializeCryptoButtons() {
  document.querySelectorAll('[data-tier]').forEach(button => {
    button.addEventListener('click', (e) => {
      const tier = e.target.dataset.tier;
      handleCryptoPayment(tier);
    });
  });
}
```

### 6. Webhook Handler

Create a webhook endpoint to receive payment confirmations:

```javascript
const crypto = require('crypto');

app.post('/webhooks/coinbase', (req, res) => {
  const signature = req.headers['x-cc-webhook-signature'];
  const body = JSON.stringify(req.body);

  // Verify webhook signature
  const hash = crypto
    .createHmac('sha256', process.env.COINBASE_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  if (hash !== signature) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;

  // Handle different event types
  switch (event.type) {
    case 'charge:confirmed':
      // Payment confirmed - grant access
      handlePaymentConfirmed(event.data);
      break;
    case 'charge:failed':
      // Payment failed
      handlePaymentFailed(event.data);
      break;
    case 'charge:pending':
      // Payment pending
      handlePaymentPending(event.data);
      break;
  }

  res.status(200).send('OK');
});

async function handlePaymentConfirmed(chargeData) {
  const { metadata } = chargeData;
  const { customer_wallet, tier } = metadata;

  // Update database to grant user access
  // await grantTierAccess(customer_wallet, tier);
  
  console.log(`Payment confirmed for ${customer_wallet} - ${tier} tier`);
}
```

### 7. Update HTML Buttons

Modify the buttons in `index.html` to use the new payment flow:

```html
<!-- Replace current placeholder buttons -->
<button 
  onclick="handleCryptoPayment('explorer')" 
  class="crypto-pay-btn"
  data-tier="explorer">
  Pay with Crypto
</button>
```

## Security Considerations

1. **Never expose API keys in frontend code** - Always use backend endpoints
2. **Verify webhook signatures** - Prevent fraudulent payment confirmations
3. **Use HTTPS** - Required for Coinbase Commerce integration
4. **Store payment records** - Keep audit trail of all transactions
5. **Handle edge cases**:
   - Underpayments
   - Overpayments
   - Payment expiration
   - Network congestion

## Testing

1. **Sandbox Mode**: Coinbase Commerce provides a sandbox for testing
2. **Test Webhooks**: Use ngrok or similar to test webhooks locally
3. **Test Scenarios**:
   - Successful payment
   - Failed payment
   - Cancelled payment
   - Expired payment

## Supported Cryptocurrencies

Coinbase Commerce supports:
- Bitcoin (BTC)
- Bitcoin Cash (BCH)
- Ethereum (ETH)
- Litecoin (LTC)
- USD Coin (USDC)
- Dogecoin (DOGE)
- And more...

## Additional Resources

- [Coinbase Commerce Documentation](https://commerce.coinbase.com/docs/)
- [API Reference](https://commerce.coinbase.com/docs/api/)
- [Node.js SDK](https://github.com/coinbase/coinbase-commerce-node)
- [Webhook Events](https://commerce.coinbase.com/docs/api/#webhooks)

## Next Steps

1. Create Coinbase Commerce account
2. Set up backend payment endpoint
3. Implement webhook handler
4. Test in sandbox mode
5. Update frontend to use real payment flow
6. Deploy and configure production webhooks
7. Monitor transactions in Coinbase Commerce dashboard
