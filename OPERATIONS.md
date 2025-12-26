# Operations Guide 🛠️

> Operational documentation for deploying and maintaining Rapid Apollo in production.

## 📋 Table of Contents

1. [Environment Setup](#environment-setup)
2. [Database Management](#database-management)
3. [Deployment](#deployment)
4. [Monitoring & Alerts](#monitoring--alerts)
5. [Troubleshooting](#troubleshooting)
6. [Security Checklist](#security-checklist)

---

## Environment Setup

### Required Environment Variables

```bash
# Core (REQUIRED)
PERPLEXITY_API_KEY=pplx-...        # Perplexity API key (Sonar Pro)
RECEIVER_WALLET_ADDRESS=0x...      # ETH wallet to receive payments
ADMIN_WALLET_ADDRESS=0x...         # Admin wallet for dashboard access

# Server
PORT=3000                          # Server port (default: 3000)
NODE_ENV=production                # Environment mode

# Security (REQUIRED in production)
MAGIC_LINK_SECRET=...              # 32+ random chars for magic link tokens
COOKIE_SECRET=...                  # 32+ random chars for cookie signing

# Optional: Database (Recommended for production)
DATABASE_URL=postgresql://user:pass@host:5432/rapid_apollo

# Optional: Redis (Recommended for production)
REDIS_URL=redis://host:6379

# Optional: Stripe Integration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Coinbase Commerce
COINBASE_COMMERCE_API_KEY=...
COINBASE_WEBHOOK_SECRET=...

# Optional: Error Monitoring
SENTRY_DSN=https://...@sentry.io/...

# Optional: CORS (defaults to * in dev)
ALLOWED_ORIGIN=https://yourdomain.com
```

### Feature Toggles

| Feature | Enabled When |
|---------|--------------|
| PostgreSQL | `DATABASE_URL` is set |
| Redis Rate Limiting | `REDIS_URL` is set + `NODE_ENV=production` |
| Stripe Payments | `STRIPE_SECRET_KEY` is set |
| Coinbase Payments | `COINBASE_COMMERCE_API_KEY` is set |
| Sentry Monitoring | `SENTRY_DSN` is set + `NODE_ENV=production` |

---

## Database Management

### Auto-Migration

Migrations run automatically on server startup when `DATABASE_URL` is set. The schema is defined in `src/db/schema.sql`.

### Manual Migration

```bash
# Connect to database and run schema
psql $DATABASE_URL < src/db/schema.sql
```

### Tables

| Table | Purpose |
|-------|---------|
| `solutions` | Stores all generated AI solutions |
| `used_tx_hashes` | Double-spend prevention |
| `stats` | Aggregated platform statistics |
| `transaction_log` | Audit trail for admin dashboard |

### Backup

```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_YYYYMMDD.sql
```

---

## Deployment

### Railway (Recommended)

1. Connect GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy triggers automatically on push to `production` branch

### Docker

```bash
# Build
docker build -t rapid-apollo .

# Run
docker run -d \
  --name rapid-apollo \
  -p 3000:3000 \
  --env-file .env \
  rapid-apollo
```

### Health Checks

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Basic liveness check |
| `GET /health/ready` | Readiness (includes DB/Redis) |
| `GET /api/health` | API-level health |

Configure your load balancer to use `/health/ready` for health probes.

---

## Monitoring & Alerts

### Sentry Setup

1. Create project at [sentry.io](https://sentry.io)
2. Set `SENTRY_DSN` environment variable
3. Sentry auto-captures:
   - Express errors
   - Unhandled promise rejections
   - Uncaught exceptions

### Recommended Alerts

| Condition | Severity | Action |
|-----------|----------|--------|
| Error rate > 5% | High | Page on-call |
| Response time > 5s | Medium | Investigate |
| Health check fails | Critical | Auto-restart |
| Disk usage > 80% | Medium | Scale storage |

### Log Aggregation

Logs are JSON-formatted for easy parsing. Recommended tools:
- **Datadog**
- **Papertrail**
- **Railway Logs** (built-in)

---

## Troubleshooting

### Common Issues

#### "PERPLEXITY_API_KEY is required"
```bash
# Check if env var is set
echo $PERPLEXITY_API_KEY

# Verify in Railway dashboard -> Variables
```

#### Database connection refused
```bash
# Check DATABASE_URL format
# Should be: postgresql://user:pass@host:5432/dbname

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

#### Redis connection timeout
```bash
# Check REDIS_URL format
# Should be: redis://host:6379

# Test connection
redis-cli -u $REDIS_URL ping
```

#### Stripe webhooks not working
1. Verify `STRIPE_WEBHOOK_SECRET` matches dashboard
2. Check webhook URL: `https://yourdomain.com/api/payments/webhooks/stripe`
3. Ensure events are enabled: `checkout.session.completed`

### Performance Tuning

#### Rate Limits (in `src/constants.ts`)

| Setting | Default | Description |
|---------|---------|-------------|
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Requests per window per IP |
| `RATE_LIMIT_WINDOW_MS` | 15 min | Rate limit window |
| `WALLET_RATE_LIMIT_MAX` | 10 | Requests per window per wallet |
| `WALLET_RATE_LIMIT_WINDOW_MS` | 1 min | Wallet rate limit window |

Adjust based on load testing results.

---

## Security Checklist

### Pre-Production

- [ ] `NODE_ENV=production` is set
- [ ] `ALLOWED_ORIGIN` is set to production domain
- [ ] `MAGIC_LINK_SECRET` is set (32+ random chars)
- [ ] `COOKIE_SECRET` is set (32+ random chars)
- [ ] All API keys are production keys (not test/sandbox)
- [ ] `SENTRY_DSN` is configured
- [ ] Database has SSL enabled
- [ ] Redis has password protection
- [ ] Webhook secrets are configured

### Regular Audits

- [ ] Run `npm audit` weekly
- [ ] Review Sentry error reports
- [ ] Check for unused admin signatures in logs
- [ ] Rotate API keys quarterly
- [ ] Review rate limit effectiveness

### Incident Response

1. **Detection**: Sentry alert received
2. **Triage**: Check error frequency and impact
3. **Mitigation**: Enable maintenance mode if needed
4. **Resolution**: Deploy fix
5. **Post-mortem**: Document learnings

---

## Contact

For production issues, contact the development team or create an issue in the GitHub repository.
