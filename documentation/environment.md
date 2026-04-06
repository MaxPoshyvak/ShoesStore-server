# Environment variables

Create a `.env` file in the project root (see `.env.example`).

## Required

- `PORT`: server port (default is `3000`)
- `MONGO_URI`: MongoDB connection string (used by `mongoose`)
- `POSTGRES_URI`: Postgres connection string (used by `pg`)
- `JWT_SECRET`: secret used to sign/verify JWTs
- `CLIENT_URL`: frontend URL used for Stripe success/cancel redirects
- `STRIPE_PUBLIC_KEY`: Stripe publishable key
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret

## Security notes

- Never commit `.env` to git (it’s already ignored).
- Prefer separate keys/secrets per environment (dev/staging/prod).

