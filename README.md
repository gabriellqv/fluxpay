# Flux Pay

A RESTful API for digital wallet management and financial transfers. The system supports user registration, JWT-based authentication, atomic money transfers between accounts, and paginated transaction history.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Runtime | Node.js 22 (ESM) |
| Language | TypeScript 6 |
| Framework | Express 5 |
| ORM | Prisma 7 (with `@prisma/adapter-pg`) |
| Database | PostgreSQL 15 |
| Validation | Zod 4 |
| Authentication | JSON Web Token (jsonwebtoken), bcrypt |
| API Documentation | Swagger UI (`swagger-ui-express`, `@asteasolutions/zod-to-openapi`) |
| Testing | Vitest 4 |
| Linting and Formatting | ESLint, Prettier |
| Git Hooks | Husky, lint-staged, Commitlint |
| CI | GitHub Actions |

## Features

- **User management** -- CRUD operations for users with unique email and CPF validation, password hashing with bcrypt.
- **Authentication** -- Login endpoint that returns a signed JWT. Protected routes use a Bearer token middleware for authorization.
- **Money transfers** -- Atomic transactions using Prisma `$transaction`. Validates sender existence, receiver existence, self-transfer prevention, and sufficient balance before executing.
- **Transaction history** -- Paginated endpoint returning transactions classified as `SENT` or `RECEIVED` relative to the authenticated user, with counterparty details.
- **Environment validation** -- All required environment variables are validated at startup using a Zod schema. The application fails immediately with a descriptive error if any variable is missing or invalid.
- **Graceful shutdown** -- The server handles `SIGTERM` and `SIGINT` signals by stopping new connections, disconnecting the Prisma client, and exiting cleanly. A 10-second timeout forces shutdown if the process hangs.
- **Rate limiting** -- Global rate limiter (100 requests per 15-minute window) and a stricter limiter for sensitive routes (15 requests per 15-minute window) applied to `/v1/auth` and `/v1/transactions`.
- **Security headers** -- Helmet middleware applied globally.
- **API documentation** -- OpenAPI 3.0 specification auto-generated from Zod schemas, served via Swagger UI at `/api-docs`.
- **Database seeding** -- Seed script that creates two test users with hashed passwords.

## Project Structure

```
src/
  @types/           # TypeScript declaration merging (Express Request extension)
  config/
    env.ts          # Environment variable validation (Zod schema)
    prisma.ts       # Prisma client configuration with pg adapter
    swagger.ts      # OpenAPI document generation
  errors/
    AppError.ts     # Custom application error class
  middlewares/
    auth.middleware.ts   # JWT verification middleware
    errorHandler.ts      # Global error handler (AppError, ZodError, Prisma errors)
    rateLimiter.ts       # Rate limiting configuration
  modules/
    auth/           # Authentication module (login DTO, service, controller, routes)
    transactions/   # Transactions module (DTOs, repository, service, controller, routes)
    users/          # Users module (DTOs, repository, service, controller, routes)
  routes/
    v1.router.ts    # Aggregated router for API v1
  app.ts            # Express application setup
  registry.ts       # Centralized dependency injection container
  server.ts         # Server entry point with graceful shutdown
prisma/
  schema.prisma     # Database schema (User, Transaction models)
  seed.ts           # Database seed script
  migrations/       # Prisma migration files
```

Each module follows the pattern: `routes -> controller -> service -> repository`, with repository interfaces for dependency inversion. Factory functions handle dependency injection.

## Requirements

- Node.js v22 or higher
- Docker and Docker Compose (for the PostgreSQL database)

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

4. Start the PostgreSQL database:

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

The server runs at `http://localhost:3000/v1` by default. The Swagger documentation is available at `http://localhost:3000/api-docs`.

## Environment Variables

The application uses the following environment variables (defined in `.env`):

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | No | `3000` | HTTP server port |
| `DATABASE_URL` | Yes | -- | PostgreSQL connection string |
| `JWT_SECRET` | Yes | -- | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | No | `1d` | JWT token expiration time |
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
| `GET` | `/v1/users/:id` | Bearer | Finds a user by ID |
| `PATCH` | `/v1/users/:id` | Bearer | Partially updates a user |
| `PUT` | `/v1/users/:id` | Bearer | Fully replaces a user |
| `DELETE` | `/v1/users/:id` | Bearer | Deletes a user |

### Transactions (`/v1/transactions`)

| Method | Route | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/v1/transactions` | Bearer | Transfers money between two users |
| `GET` | `/v1/transactions/history` | Bearer | Returns paginated transaction history |

## Testing

Unit tests cover the service layer for all three modules (`AuthService`, `UsersService`, `TransactionsService`). Repository dependencies are mocked using `vi.fn()`.

Run the test suite:

```bash
npm run test
```

## Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `dev` | `npm run dev` | Starts the server in watch mode with `tsx` |
| `build` | `npm run build` | Compiles TypeScript source files into dist directory |
| `test` | `npm run test` | Runs unit tests with Vitest |
| `typecheck` | `npm run typecheck` | Runs TypeScript type checking (`tsc --noEmit`) |
| `lint` | `npm run lint` | Runs ESLint on source files |
| `format:check` | `npm run format:check` | Checks code formatting with Prettier |
| `format:fix` | `npm run format:fix` | Fixes code formatting with Prettier |

## Continuous Integration

The GitHub Actions CI pipeline runs on pushes and pull requests to `main` and `develop` branches. It executes the following steps in order: dependency installation, type checking, linting, format checking, and unit tests.
