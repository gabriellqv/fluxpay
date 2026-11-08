#!/usr/bin/env bash
#
# Runs the GitHub Actions workflow locally with `act`, before pushing a branch.
#
# Two environment details are handled here so the run matches GitHub:
#
# 1. The developer's `.env` is moved out of the repository. `prisma.config.ts`
#    loads dotenv from the project root, so leaving `.env` in place would
#    override the workflow's DATABASE_URL with the local credentials.
# 2. The local PostgreSQL container is stopped to free port 5432 for the
#    workflow's `services.postgres` container, which the job reaches at
#    `localhost:5432` under the host network configured in `.actrc`.
#
# Both are restored by the EXIT trap, including on failure.

set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v act >/dev/null 2>&1; then
  echo "act is not installed. See https://github.com/nektos/act" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
ENV_BACKUP="$TMP_DIR/.env"

restore() {
  if [ -f "$ENV_BACKUP" ]; then
    mv "$ENV_BACKUP" .env
  fi
  rm -rf "$TMP_DIR"
  docker start fluxpay-db >/dev/null 2>&1 || true
}
trap restore EXIT

if [ -f .env ]; then
  mv .env "$ENV_BACKUP"
fi

docker stop fluxpay-db >/dev/null 2>&1 || true

act -j build-and-test "$@"
