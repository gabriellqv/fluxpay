-- Money invariants enforced at the database level.
--
-- The application validates these rules too, but the database is the last
-- line of defence: a race condition, a maintenance script or a future code
-- path that bypasses the service layer must never be able to create a
-- negative balance or a zero/negative transfer.
--
-- `NOT VALID` followed by `VALIDATE` avoids holding an ACCESS EXCLUSIVE lock
-- while the whole table is scanned. New rows are checked immediately; the
-- validation step only takes a lighter lock on existing rows.
ALTER TABLE "users" ADD CONSTRAINT "users_balance_non_negative"
  CHECK ("balance" >= 0) NOT VALID;
ALTER TABLE "users" VALIDATE CONSTRAINT "users_balance_non_negative";

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_amount_positive"
  CHECK ("amount" > 0) NOT VALID;
ALTER TABLE "transactions" VALIDATE CONSTRAINT "transactions_amount_positive";
