# 👟 ShoesStore Server

<p align="center">
  <strong>Backend API for an e-commerce shoe store</strong><br>
  Built with <strong>Express</strong> + <strong>TypeScript</strong>, powered by <strong>PostgreSQL</strong>, <strong>MongoDB</strong>, and <strong>Stripe</strong>.
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-tech-stack">Tech Stack</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-api-endpoints">API Endpoints</a> ·
  <a href="#-documentation">Documentation</a> ·
  <a href="#-environment">Environment</a>
</p>

---

## ✨ Features

- **User auth** — registration, login, email verification, JWT-based sessions, profile management
- **Product catalog** — full CRUD with categories, sizes, images, stock tracking
- **Orders** — guest & authenticated checkout, stock auto-deduction, order history
- **Payments** — Stripe Checkout integration with webhook processing
- **Favorites** — save/remove products, list user favorites
- **Viewing history** — track viewed products per user
- **Search history** — track user search queries
- **Reviews & ratings** — product feedback (1–5 stars) with MongoDB storage
- **Waitlist** — email notifications when out-of-stock items are back
- **Telegram bots** — support chat (Socket.IO real-time) + info/notification bot
- **Dashboard analytics** — revenue, orders, customers, Google Analytics page views, activity log
- **Dual database** — PostgreSQL for transactional data, MongoDB for activity/analytics data

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **MongoDB** ≥ 6
- A **Stripe** account (for payments)
- A **Telegram Bot** token (optional, for bot features)

### Installation

```bash
# Clone the repo
git clone <repo-url> && cd ShoesStore-server

# Install dependencies
npm install
# or
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your values (see Environment section below)

# Start development server
npm run dev
# or
bun run dev
```

The server will start at `http://localhost:3000`.

### Build for production

```bash
npm run build   # Compiles TypeScript → dist/
npm start       # Runs dist/server.js
```

---

## 🛠 Tech Stack

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| **Runtime**    | Node.js                                         |
| **Language**   | TypeScript                                      |
| **Framework**  | Express.js                                      |
| **Databases**  | PostgreSQL (via `pg`), MongoDB (via `mongoose`) |
| **Auth**       | JWT (`jsonwebtoken`), bcrypt                    |
| **Payments**   | Stripe (Checkout Sessions + Webhooks)           |
| **Real-time**  | Socket.IO (support chat)                        |
| **Bots**       | node-telegram-bot-api (Support Bot + Info Bot)  |
| **Validation** | Yup (request body schemas)                      |
| **Docs**       | OpenAPI 3.0 + Swagger UI (`swagger-ui-express`) |
| **Analytics**  | Google Analytics Data API (GA4)                 |
| **Email**      | Resend API (`nodemailer` types)                 |

---

## 📁 Architecture

```
src/
├── app.ts                    # Express app setup (CORS, JSON, routes, Swagger)
├── server.ts                 # HTTP server + Socket.IO + DB connections
├── bot/
│   ├── InfoBot/              # Telegram bot for order notifications
│   │   ├── index.ts
│   │   ├── commands/         # /start, /test
│   │   └── services/         # Notification service
│   └── SupportBot/           # Telegram bot for customer support
│       ├── index.ts
│       ├── commands/         # /start, /test
│       └── services/         # Message handling, user notifications
├── config/
│   └── dataBase/
│       ├── mongoDb.ts        # MongoDB connection (Singleton)
│       └── postgreSQL.ts     # PostgreSQL connection pool
├── controllers/              # Route handlers (11 controllers)
│   ├── users.controller.ts
│   ├── goods.controller.ts
│   ├── orders.controller.ts
│   ├── payments.controller.ts
│   ├── favorites.controller.ts
│   ├── history.controller.ts
│   ├── searchInfo.controller.ts
│   ├── feedbacks.controller.ts
│   ├── waitlst.controller.ts
│   ├── telegram.controller.ts
│   └── statistic.controller.ts
├── docs/
│   └── swagger.ts            # Swagger UI mounting + multi-file spec loader
├── middlewares/
│   ├── authMiddleware.ts         # JWT verification
│   ├── adminMiddleware.ts        # Admin role check
│   ├── optionalAuthMiddleware.ts # Optional JWT (for guest checkout)
│   ├── userValidation.ts         # Yup schemas for user input
│   └── goodsValidation.ts        # Yup schemas for product input
├── models/                   # MongoDB (Mongoose) models
│   ├── Activity.ts           # User activity log
│   ├── Favorites.ts          # User favorites
│   ├── Feedback.ts           # Product reviews
│   ├── History.ts            # Viewing history
│   └── SearchInfo.ts         # Search query history
├── routes/                   # Express routers (11 route files)
│   ├── index.ts              # Main router (mounts all sub-routers)
│   ├── users.routes.ts
│   ├── goods.routes.ts
│   ├── orders.routes.ts
│   ├── payments.routes.ts
│   ├── favorites.routes.ts
│   ├── history.routes.ts
│   ├── searchInfo.routes.ts
│   ├── feedbacks.routes.ts
│   ├── waitlist.routes.ts
│   ├── telegram.routes.ts
│   └── statistic.routes.ts
├── types/
│   └── index.ts              # TypeScript interfaces (RequestWithUser, etc.)
├── utils/
│   ├── activityLogger.ts     # Activity logging helper
│   └── email.service.ts      # Email sending (verification, restock)
└── yupValidation/
    ├── goodsSchema.ts        # Yup schema for product creation/update
    └── userSchema.ts         # Yup schema for registration/login
```

---

## 📡 API Endpoints

Base URL: `/api`

### Auth & Users

| Method  | Endpoint                           | Auth     | Description                    |
| ------- | ---------------------------------- | -------- | ------------------------------ |
| `POST`  | `/users/registration`              | —        | Register new account           |
| `POST`  | `/users/login`                     | —        | Login, get JWT                 |
| `POST`  | `/users/verify-email`              | —        | Verify email with token        |
| `POST`  | `/users/resend-verification-email` | —        | Resend verification email      |
| `GET`   | `/users/me`                        | ✅       | Get profile + orders + reviews |
| `PATCH` | `/users/edit`                      | ✅       | Update profile (partial)       |
| `GET`   | `/users`                           | ✅ Admin | List all users                 |

### Products

| Method   | Endpoint           | Auth     | Description           |
| -------- | ------------------ | -------- | --------------------- |
| `GET`    | `/goods`           | —        | List all products     |
| `GET`    | `/goods/:id`       | —        | Get product by ID     |
| `POST`   | `/goods`           | ✅ Admin | Create product        |
| `PUT`    | `/goods/:id`       | ✅ Admin | Update product (full) |
| `DELETE` | `/goods/:id`       | ✅ Admin | Delete product        |
| `PATCH`  | `/goods/stock/:id` | ✅ Admin | Update stock quantity |

### Orders

| Method | Endpoint          | Auth     | Description                  |
| ------ | ----------------- | -------- | ---------------------------- |
| `POST` | `/orders`         | —/✅     | Create order (guest or auth) |
| `GET`  | `/orders`         | ✅ Admin | List all orders              |
| `GET`  | `/orders/:id`     | ✅ Admin | Get order details            |
| `GET`  | `/orders/:userId` | ✅       | Get orders by user ID        |

### Payments

| Method | Endpoint                    | Auth     | Description                    |
| ------ | --------------------------- | -------- | ------------------------------ |
| `POST` | `/payments/create/:orderId` | ✅       | Create Stripe Checkout session |
| `GET`  | `/payments/get`             | ✅ Admin | List all payments              |
| `POST` | `/payments/webhook`         | —        | Stripe webhook (raw body)      |

### Favorites

| Method   | Endpoint                    | Auth | Description           |
| -------- | --------------------------- | ---- | --------------------- |
| `POST`   | `/favorites/add`            | ✅   | Add to favorites      |
| `GET`    | `/favorites/get`            | ✅   | List favorites        |
| `DELETE` | `/favorites/remove/:goodId` | ✅   | Remove from favorites |

### History & Search

| Method | Endpoint           | Auth | Description                   |
| ------ | ------------------ | ---- | ----------------------------- |
| `POST` | `/history/add`     | ✅   | Add viewed product to history |
| `GET`  | `/history/get`     | ✅   | Get viewing history           |
| `POST` | `/search-info/add` | ✅   | Log a search query            |
| `GET`  | `/search-info/get` | ✅   | Get search history            |

### Reviews

| Method | Endpoint         | Auth | Description               |
| ------ | ---------------- | ---- | ------------------------- |
| `POST` | `/feedbacks/add` | ✅   | Add a review (1–5 rating) |
| `GET`  | `/feedbacks/get` | —    | Get all reviews           |

### Waitlist

| Method | Endpoint    | Auth | Description                         |
| ------ | ----------- | ---- | ----------------------------------- |
| `POST` | `/waitlist` | —/✅ | Join waitlist for out-of-stock item |

### Telegram

| Method | Endpoint                         | Auth     | Description                       |
| ------ | -------------------------------- | -------- | --------------------------------- |
| `GET`  | `/telegram/generate-link/:bot`   | ✅       | Generate deep link (support/info) |
| `POST` | `/telegram/send-support-message` | ✅ Admin | Send support message              |
| `GET`  | `/telegram/get-history/:chatId`  | ✅ Admin | Get chat message history          |
| `GET`  | `/telegram/get-support-chats`    | ✅ Admin | List all support chats            |

### Statistics

| Method | Endpoint                  | Auth     | Description                        |
| ------ | ------------------------- | -------- | ---------------------------------- |
| `GET`  | `/statistic/get`          | ✅ Admin | Dashboard stats (revenue, orders…) |
| `POST` | `/statistic/activtiy/get` | ✅ Admin | Full activity log                  |

---

## 📖 Documentation

Interactive API documentation is available via **Swagger UI**:

- **Swagger UI:** `GET /docs` (when server is running)
- **OpenAPI spec:** `GET /openapi.yaml`

The OpenAPI spec is split into modular files:

```
documentation/
├── README.md
├── environment.md
└── swagger/
    ├── openapi.yaml          # Main entry point
    ├── schemas.yaml          # 31 shared schemas
    └── paths/
        ├── users.yaml
        ├── goods.yaml
        ├── orders.yaml
        ├── payments.yaml
        ├── favorites.yaml
        ├── history.yaml
        ├── search-info.yaml
        ├── feedbacks.yaml
        ├── waitlist.yaml
        ├── telegram.yaml
        └── statistic.yaml
```

---

## 🔐 Environment

Create a `.env` file in the project root (copy from `.env.example`):

```env
# Server
PORT=3000

# Databases
MONGO_URI=mongodb://localhost:27017/shoesstore
POSTGRES_URI=postgresql://user:password@localhost:5432/shoesstore

# Auth
JWT_SECRET=replace_me_with_long_random_secret

# Stripe
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Frontend URL (Stripe redirects)
CLIENT_URL=http://localhost:5173
```

See [`documentation/environment.md`](documentation/environment.md) for full details.

---

## 📜 Scripts

| Command         | Description                      |
| --------------- | -------------------------------- |
| `npm run dev`   | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/`    |
| `npm start`     | Run production build             |

---

## 🔒 Security Notes

- Never commit `.env` to version control
- Use separate API keys per environment (dev / staging / prod)
- JWT tokens expire after **12 hours**
- Stripe webhook requests are verified via signature
- Passwords are hashed with **bcrypt** (10 rounds)
- CORS is configured for specific origins only
