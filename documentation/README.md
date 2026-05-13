# ShoesStore Server Documentation

This folder contains **project documentation** and the **Swagger (OpenAPI) specification**.

## Quick start

- Copy `.env.example` → `.env` and fill values
- Install dependencies: `npm install`
- Run dev server: `npm run dev`

## Swagger UI

When the server is running, open:

- `GET /docs` – interactive Swagger UI
- `GET /openapi.yaml` – raw OpenAPI YAML (main entry point)

## OpenAPI spec structure

The spec is split into multiple files for maintainability:

```
documentation/swagger/
├── openapi.yaml          # Main entry point (info, tags, refs)
├── schemas.yaml          # Shared component schemas
└── paths/
    ├── users.yaml        # User registration, login, profile
    ├── goods.yaml        # Product catalog CRUD
    ├── orders.yaml       # Order management
    ├── payments.yaml     # Stripe payments & webhook
    ├── favorites.yaml    # User favorites
    ├── history.yaml      # Viewing history
    ├── search-info.yaml  # Search query history
    ├── feedbacks.yaml    # Product reviews
    ├── waitlist.yaml     # Out-of-stock waitlist
    ├── telegram.yaml     # Telegram bot integration
    └── statistic.yaml    # Dashboard statistics & activity
```

## Environment

- See [`environment.md`](./environment.md)

## Auth

Most endpoints are protected with **Bearer JWT**:

- Send header: `Authorization: Bearer <token>`
- Get a token via `POST /api/users/login`

## Stripe webhook

- Endpoint: `POST /api/payments/webhook`
- Important: it expects a **raw** `application/json` body (the app uses `express.raw()` for this route)
- Stripe must send the `stripe-signature` header for signature verification
