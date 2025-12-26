# Rapid Apollo 🚀

> **AI-powered problem solver with Ethereum payment gateway**

A crypto-gated AI backend that provides tiered access to advanced problem-solving capabilities, powered by **Perplexity Sonar Pro**.

## ✨ Features

- **🔐 Ethereum Payment Verification** - Direct on-chain payment validation
- **📱 Mobile Optimised** - Full mobile support with hamburger menu & deep-linking guidance
- **💳 Stripe & Coinbase Commerce** - Alternative payment methods with webhooks
- **🧠 Tiered AI Responses** - Powered by Perplexity Sonar Pro with real-time web search
- **📊 Admin Dashboard** - Real-time analytics and transaction history
- **🔒 Security First** - Double-spend protection, signature replay prevention, rate limiting
- **☁️ Redis Support** - Scalable session storage for production
- **🗄️ PostgreSQL** - Persistent data storage with auto-migrations
- **📝 Structured Logging** - Production-ready JSON logs with sensitive data redaction

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Express.js + TypeScript |
| AI | Perplexity API (Sonar Pro) |
| Blockchain | Ethereum Mainnet (ethers.js) |
| Payments | Stripe, Coinbase Commerce |
| Database | PostgreSQL (optional) |
| Cache | Redis (optional) |
| Testing | Jest + Playwright |
| Deployment | Railway / Docker |

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Ethereum wallet (for receiving payments)
- Perplexity API key

### Installation

```bash
# Clone the repository
git clone https://github.com/anorbert-cmyk/rapid-apollo.git
cd rapid-apollo

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Start development server
npm run dev
```

### Environment Variables

```env
PORT=3000
NODE_ENV=development
PERPLEXITY_API_KEY=pplx-...        # Required for AI generation
RECEIVER_WALLET_ADDRESS=0x...      # Your Ethereum Address
ADMIN_WALLET_ADDRESS=0x...         # Admin Wallet Address
REDIS_URL=redis://localhost:6379   # Optional
DATABASE_URL=postgresql://...      # Optional
```

## 📦 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build TypeScript to dist/ |
| `npm run start:prod` | Run production build |
| `npm test` | Run Jest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |

## 🔧 API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/pricing` | Current tier prices in ETH |
| GET | `/api/config` | Receiver wallet address |
| POST | `/api/solve` | Submit problem with payment |
| POST | `/api/history` | Fetch user history (signed) |
| POST | `/api/share/create` | Create shareable link |
| GET | `/api/share/:uuid` | View shared result |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/stripe/create-session` | Create Stripe checkout |
| POST | `/api/payments/coinbase/create-charge` | Create Coinbase charge |
| POST | `/api/payments/webhooks/stripe` | Stripe webhook handler |
| POST | `/api/payments/webhooks/coinbase` | Coinbase webhook handler |

### Admin (Wallet-authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/check-status` | Verify admin status |
| POST | `/api/admin/stats` | Platform analytics |
| POST | `/api/admin/transactions` | Transaction history |

### Documentation

- `/api-docs` - Swagger UI (OpenAPI)

## 🏗️ Architecture

```
src/
├── server.ts         # Express app setup
├── config.ts         # Environment validation (Zod)
├── constants.ts      # Magic numbers centralized
├── store.ts          # Redis/Memory abstraction
├── db/               # PostgreSQL layer
│   ├── index.ts      # Connection pool & migrations
│   ├── schema.sql    # Database schema
│   └── solutionRepository.ts
├── routes/
│   ├── index.ts      # API routes
│   ├── admin.ts      # Admin endpoints
│   ├── payment.ts    # Stripe/Coinbase routes
│   └── health.ts     # Health checks
├── services/
│   ├── perplexityService.ts # Core AI Engine (Sonar Pro)
│   ├── aiChainService.ts    # Multi-turn Logic & Prompt Chaining
│   ├── emailService.ts      # Resend integration (Magic Links)
│   ├── magicLinkService.ts  # Auth token management
│   ├── paymentService.ts    # Ethereum verification
│   ├── stripeService.ts     # Stripe checkout
│   ├── coinbaseService.ts   # Coinbase Commerce
│   └── priceService.ts      # ETH price fetching
├── utils/
│   ├── logger.ts             # Structured logging
│   ├── sentry.ts             # Error tracking
│   ├── walletRateLimiter.ts  # Per-wallet limits
│   ├── redisRateLimiter.ts   # Production limiter
│   └── signatureStore.ts     # Replay protection
└── __tests__/        # Jest unit tests
```

## 🐳 Docker

```bash
# Build
docker build -t rapid-apollo .

# Run
docker run -p 3000:3000 --env-file .env rapid-apollo
```

## 🔒 Security Features

- **Helmet** - Secure HTTP headers
- **Rate Limiting** - IP-based (100 req/15min) + wallet-based (10 req/min)
- **Double-Spend Protection** - Atomic transaction locking
- **Signature Replay Prevention** - Used signatures tracked with TTL
- **Admin Auth** - Timestamped signatures (5 min expiry)
- **Input Validation** - Zod schemas on all endpoints
- **Body Size Limit** - 100KB max payload
- **Graceful Shutdown** - Clean Redis/DB disconnection
- **Unhandled Rejection Capture** - Sentry integration

## 📈 Tiers & Pricing

| Tier | USD | AI Model | Response Style |
|------|-----|----------|----------------|
| Standard | $19 | o3-mini | Concise, direct answer |
| Medium | $49 | GPT-5.2 | Detailed with examples |
| Full | $199 | GPT-5.2 | PhD-level deep dive |

## 📝 License

ISC

---

Built with ❤️ for the decentralized future.
