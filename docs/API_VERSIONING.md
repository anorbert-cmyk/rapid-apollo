# API Versioning Documentation

## Overview
The Rapid Apollo API uses versioned endpoints to ensure backward compatibility while allowing for iterative improvements.

## Current Versions

### v1 (Current - Recommended)
Base URL: `/api/v1`

All new development should use the v1 API endpoints. These endpoints receive all new features and security updates.

### Legacy Routes (Deprecated)
Base URL: `/api`

Legacy routes are maintained for backward compatibility but are **deprecated** as of December 2024.

> [!WARNING]
> Legacy routes will be sunset on **March 1, 2025**. Please migrate to v1 endpoints before this date.

## Deprecation Headers

All legacy routes return the following HTTP headers:

| Header | Value | Description |
|--------|-------|-------------|
| `Deprecation` | `true` | Indicates the endpoint is deprecated |
| `Sunset` | `Sat, 01 Mar 2025 00:00:00 GMT` | Date when the endpoint will be removed |
| `Link` | `</api/v1>; rel="successor-version"` | Points to the successor version |

## Migration Guide

### Endpoint Mappings

| Legacy Endpoint | v1 Endpoint |
|-----------------|-------------|
| `POST /api/solve` | `POST /api/v1/solve` |
| `GET /api/price` | `GET /api/v1/price` |
| `POST /api/payments/stripe/create-session` | `POST /api/v1/payments/stripe/create-session` |
| `POST /api/payments/coinbase/create-charge` | `POST /api/v1/payments/coinbase/create-charge` |
| `GET /api/payments/status/:id` | `GET /api/v1/payments/status/:id` |
| `GET /api/admin/*` | `GET /api/v1/admin/*` |

### Request/Response Format

Request and response formats remain identical between legacy and v1 endpoints. The only change required is updating the base URL prefix.

### Health Check Endpoints (Unversioned)

Health check endpoints are not versioned and remain at:

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Comprehensive health status |
| `GET /health/live` | Kubernetes liveness probe |
| `GET /health/ready` | Kubernetes readiness probe |

## Error Handling

Both legacy and v1 endpoints return errors in the same format:

```json
{
    "error": "Error message description"
}
```

HTTP status codes remain consistent across versions.

## Rate Limiting

Rate limits apply equally to both legacy and v1 endpoints:
- **IP-based**: 100 requests per 15 minutes
- **Wallet-based**: 10 requests per hour for payment endpoints

## Breaking Changes Policy

When introducing breaking changes:
1. A new API version (e.g., v2) will be created
2. The previous version will be deprecated with a minimum 6-month sunset period
3. Migration guides will be provided
4. Deprecation headers will be added to all old version endpoints
