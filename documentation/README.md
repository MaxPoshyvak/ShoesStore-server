# ShoesStore Server Documentation

This folder contains **project documentation** and the **Swagger (OpenAPI) specification**.

## Quick start

- Copy `.env.example` → `.env` and fill values
- Install dependencies: `npm install`
- Run dev server: `npm run dev`

## Swagger UI

When the server is running, open:

- `GET /docs` – interactive Swagger UI
- `GET /openapi.yaml` – raw OpenAPI YAML

## OpenAPI spec location

- `documentation/swagger/openapi.yaml`

## Environment

- See `documentation/environment.md`

## Auth

Most endpoints are protected with **Bearer JWT**:

- Send header: `Authorization: Bearer <token>`
- Get a token via `POST /api/users/login`

## Stripe webhook

- Endpoint: `POST /api/payments/webhook`
- Important: it expects a **raw** `application/json` body (the app uses `express.raw()` for this route)
- Stripe must send the `stripe-signature` header for signature verification
