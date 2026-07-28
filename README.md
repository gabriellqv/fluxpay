# Flux Pay

A RESTful API for digital wallet management, financial transfers, and real-time notifications. The system supports user registration, JWT-based authentication, atomic money transfers between accounts, paginated transaction history with filtering, Redis cache-aside caching, BullMQ job queues, and Swagger OpenAPI documentation.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Runtime | Node.js 22 (ESM) |
| Language | TypeScript 6 |
| Framework | Express 5 |
| ORM | Prisma 7 (with `@prisma/adapter-pg`) |
| Database | PostgreSQL 15 |
| Cache & Queues | Redis 7, BullMQ 5 |
| Validation | Zod 4 |
| Authentication | JSON Web Token (jsonwebtoken), bcrypt |
| API Documentation | Swagger UI (`swagger-ui-express`, `@asteasolutions/zod-to-openapi`) |
| Testing | Vitest 4, Supertest |
| Linting and Formatting | ESLint, Prettier |
| Git Hooks | Husky, lint-staged, Commitlint |
| CI | GitHub Actions |

## Features

- **User management** -- CRUD operations for users with unique email and CPF validation, password hashing with bcrypt.
- **Authentication** -- Login endpoint returning signed JWTs. Protected routes use Bearer token authorization middleware.
- **Money transfers** -- Atomic transactions using Prisma `$transaction`. Validates sender, receiver, self-transfer prevention, and balance with Prisma `Decimal` precision.
- **Transaction history** -- Paginated endpoint returning transactions classified as `SENT` or `RECEIVED` relative to the authenticated user, with optional `?type=SENT|RECEIVED` filtering and counterparty details.
- **Transaction details** -- Individual transaction lookup endpoint with strict ownership authorization (only sender or receiver can view).
- **Asynchronous notifications** -- BullMQ background job queue for sending transfer notifications to receivers with automatic deduplication by transaction ID.
- **Notification management** -- Endpoints to retrieve notifications, fetch unread notification count, and mark notifications as read.
- **Cache-aside strategy** -- Redis caching for user profiles and transaction history pages, with pattern-based invalidation upon new transfer execution.
- **Environment validation** -- Startup validation of all required environment variables using Zod schemas.
- **Graceful degradation & shutdown** -- The application functions seamlessly even if Redis is offline (notifications and cache gracefully fall back), and cleans up database connections on termination signals (`SIGTERM`/`SIGINT`).
- **Rate limiting** -- Global rate limiter (100 requests per 15-min) and strict rate limiter (15 requests per 15-min) for sensitive routes (`/v1/auth`, `/v1/transactions`).
- **Security audit & headers** -- Helmet middleware globally applied, with automated CI vulnerability audits (`npm audit`).
- **API documentation** -- Full OpenAPI 3.0 specification auto-generated from Zod schemas with complete request and response JSON schemas, served via Swagger UI at `/api-docs`.

## Project Structure

```
src/
  @types/           # TypeScript declaration merging (Express Request extension)
  cache/            # Redis cache service and key factories
  config/
    env.ts          # Environment variable validation (Zod schema)
    logger.ts       # Pino logger configuration
    prisma.ts       # Prisma client configuration with pg adapter
    redis.ts        # Redis client connection configuration
    swagger.ts      # OpenAPI document generation
  errors/
    AppError.ts     # Custom application error class
  jobs/
    processors/     # BullMQ job processors
    queues/         # Queue definitions
    workers/        # Background worker setup
  middlewares/
    auth.middleware.ts   # JWT verification middleware
    authorizeOwner.ts    # Ownership authorization middleware
    errorHandler.ts      # Global error handler
    rateLimiter.ts       # Rate limiting configuration
  modules/
    auth/           # Authentication module (login DTO, service, controller, routes)
    notifications/  # Notifications module (repository, service, controller, routes)
    transactions/   # Transactions module (DTOs, repository, service, controller, routes)
    users/          # Users module (DTOs, repository, service, controller, routes)
  routes/
    v1.router.ts    # Aggregated router for API v1
  app.ts            # Express application setup
  server.ts         # Server entry point with graceful shutdown
prisma/
  schema.prisma     # Database schema (User, Transaction, Notification models)
  seed.ts           # Database seed script
```

## Requirements

- Node.js v22 or higher
- Docker and Docker Compose (for PostgreSQL and Redis)

## Technical Decisions

1. **Layered Architecture & Dependency Inversion:**
   Each module is structured into `routes -> controller -> service -> repository`. Services depend on interface abstractions (`IUsersRepository`, `ITransactionsRepository`, `INotificationsRepository`) rather than concrete Prisma implementations. Dependency injection is managed via clean manual factory functions (`makeUsersController`, etc.).

2. **Financial Atomicity & Decimal Precision:**
   Money transfers run inside a single interactive Prisma transaction (`prisma.$transaction`). Balance updates use Prisma's atomic `decrement` and `increment` operations to prevent race conditions. Balance comparisons use `Prisma.Decimal.lessThan()` to guarantee high precision for financial operations.

3. **Cache-Aside Pattern & Pattern Invalidation:**
   User profiles and transaction history pages are cached in Redis with short TTLs (60s and 30s). When a transfer occurs, cache keys for both sender and receiver profiles are invalidated, and all cached history pages are purged using pattern invalidation (`user:<id>:history:*`).

4. **Resilient Asynchronous Job Queues:**
   Notifications are enqueued via BullMQ with job deduplication (`jobId: notify-receiver:<transactionId>`). The application implements graceful degradation: if Redis is disconnected or unavailable, transfers succeed normally while notification jobs fall back safely without throwing unhandled exceptions.

5. **Layered Security & Ownership Authorization:**
   Authentication uses JWT with `sub` claims. Authorization enforcement uses an `authorizeOwner` middleware for user profile modifications and explicit ownership checks for transaction details (`senderId === userId || receiverId === userId`). Sensitive endpoints enforce strict rate limits and helmet security headers.

## Installation

1. Clone the repository:

```bash
git clone https://github.com/gabriellqv/fluxpay.git
cd fluxpay
```

2. Install dependencies:

```bash
npm install
```

3. Copy the environment example file and configure it:

```bash
cp .env.example .env
```

4. Start the PostgreSQL and Redis containers:

```bash
docker compose up -d
```

5. Run database migrations:

```bash
npx prisma migrate dev
```

6. Seed the database (optional):

```bash
npx prisma db seed
```

7. Start the development server:

```bash
npm run dev
```

The server runs at `http://localhost:3000/v1` by default. Swagger documentation is available at `http://localhost:3000/api-docs`.

## Environment Variables

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | No | `3000` | HTTP server port |
| `DATABASE_URL` | Yes | -- | PostgreSQL connection string |
| `JWT_SECRET` | Yes | -- | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | No | `1d` | JWT token expiration time |
| `REDIS_HOST` | No | `localhost` | Redis host for caching and job queues |
| `REDIS_PORT` | No | `6379` | Redis port |
| `NODE_ENV` | No | `development` | Environment (`development`, `production`, `test`) |

## API Endpoints

### Health Check

| Method | Route | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/` or `/health` | No | Returns API status |

### Authentication (`/v1/auth`)

| Method | Route | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/v1/auth/login` | No | Authenticates a user and returns a JWT |

### Users (`/v1/users`)

| Method | Route | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/v1/users` | No | Creates a new user |
| `GET` | `/v1/users/me` | Bearer | Returns the authenticated user profile |
| `GET` | `/v1/users/:id` | Bearer | Finds a user by ID (owner only) |
| `PATCH` | `/v1/users/:id` | Bearer | Partially updates a user (owner only) |
| `PUT` | `/v1/users/:id` | Bearer | Fully replaces a user (owner only) |
| `DELETE` | `/v1/users/:id` | Bearer | Deletes a user (owner only) |

### Transactions (`/v1/transactions`)

| Method | Route | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/v1/transactions` | Bearer | Transfers money between two users |
| `GET` | `/v1/transactions/history` | Bearer | Returns paginated transaction history (`?page=1&limit=10&type=SENT\|RECEIVED`) |
| `GET` | `/v1/transactions/:id` | Bearer | Returns details of a specific transaction (sender or receiver only) |

### Notifications (`/v1/notifications`)

| Method | Route | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/v1/notifications` | Bearer | Returns all notifications for the authenticated user |
| `GET` | `/v1/notifications/unread-count` | Bearer | Returns unread notification count |
| `PATCH` | `/v1/notifications/:id/read` | Bearer | Marks a notification as read |

## Testing

Unit and integration tests cover all modules (`AuthService`, `UsersService`, `TransactionsService`, `NotificationsService`, and E2E routes).

Run the test suite:

```bash
npm run test
```

## Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `dev` | `npm run dev` | Starts the server in watch mode with `tsx` |
| `build` | `npm run build` | Compiles TypeScript source files into dist directory |
| `test` | `npm run test` | Runs unit and integration tests with Vitest |
| `typecheck` | `npm run typecheck` | Runs TypeScript type checking (`tsc --noEmit`) |
| `lint` | `npm run lint` | Runs ESLint on source files |
| `format:check` | `npm run format:check` | Checks code formatting with Prettier |
| `format:fix` | `npm run format:fix` | Fixes code formatting with Prettier |

## Continuous Integration

The GitHub Actions CI pipeline runs on pushes and pull requests to `main` and `develop` branches. It executes: dependency installation, type checking, linting, format checking, test execution, and security dependency auditing (`npm audit`).
