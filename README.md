# Rapid Apollo 🚀

> **AI-powered problem solver with Ethereum payment gateway**

A crypto-gated AI backend that provides tiered access to advanced problem-solving capabilities, powered by Google Gemini.

## ✨ Features

- **🔐 Ethereum Payment Verification** - Direct on-chain payment validation
- **🧠 Tiered AI Responses** - Standard, Medium, and Full tier solutions via Gemini
- **📊 Admin Dashboard** - Real-time analytics and transaction history
- **🔒 Security First** - Double-spend protection, signature replay prevention, rate limiting
- **☁️ Redis Support** - Scalable session storage for production
- **📝 Structured Logging** - Production-ready JSON logs with sensitive data redaction

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Express.js + TypeScript |
| AI | Google Gemini API |
| Blockchain | Ethereum Mainnet (ethers.js) |
| Cache | Redis (optional) |
| Testing | Jest + Playwright |
| Deployment | Railway / Docker |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Ethereum wallet (for receiving payments)
- Google Gemini API key

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
GEMINI_API_KEY=your_gemini_api_key
RECEIVER_WALLET_ADDRESS=0xYourEthereumAddress
ADMIN_WALLET_ADDRESS=0xAdminWallet
REDIS_URL=redis://localhost:6379  # Optional
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
├── routes/
│   ├── index.ts      # API routes
│   └── admin.ts      # Admin endpoints
├── services/
│   ├── aiService.ts      # Gemini integration
│   ├── paymentService.ts # Ethereum verification
│   └── priceService.ts   # ETH price fetching
├── utils/
│   ├── logger.ts             # Structured logging
│   ├── errorMonitoring.ts    # Error tracking
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
- **Signature Replay Prevention** - Used signatures tracked
- **Input Validation** - Zod schemas on all endpoints
- **Body Size Limit** - 100KB max payload
- **Graceful Shutdown** - Clean Redis disconnection

## 📈 Tiers & Pricing

| Tier | USD | Response Style |
|------|-----|----------------|
| Standard | $19 | Concise, direct answer |
| Medium | $49 | Detailed with examples |
| Full | $199 | PhD-level deep dive |

## 📝 License

ISC

---

Built with ❤️ for the decentralized future.
