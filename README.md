# Flux Pay

This project is the API for Flux Pay, a modern financial platform. The system allows users to register and perform transfers and balance exchanges quickly and securely.

## Technologies

* Node.js with TypeScript
* Express
* Prisma ORM
* PostgreSQL
* Zod for Data Validation
* Vitest for Unit Testing

## Installation and Execution

### Prerequisites

* Node.js
* PostgreSQL

### Steps to run locally

1. Clone the repository.
2. Install the dependencies.
3. Copy the environment example file and configure the connection to your database.
4. Execute the database migrations.
5. Start the application.

## Architecture

The project was built using Clean Architecture and SOLID principles. The application is divided into modules separated by business domain. Each module has its own routes, controllers, services, and repositories, clearly separating responsibilities.

## Tests

To run the unit tests of the application, execute the test script configured in the project.
