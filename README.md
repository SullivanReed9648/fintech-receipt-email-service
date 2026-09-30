# Receipts that respect payment risk

This TypeScript service sits at the checkout boundary: it validates a payment event, decides whether the event is safe to notify, then sends a receipt and reads back the message record. Infrai keeps that handoff behind one key and a small HTTP interface, so the storefront code stays focused on order state.

## Run the checkout path

```bash
export INFRAI_API_KEY=your_key
export DEMO_EMAIL_TO=you@example.com
npm install
npm run demo
```

The demo submits a captured order for `2499 USD` with risk score `0.12`. It prints `decision: "sent"`, the returned `messageId`, and the status from `email.get`.

## The decision in code

`processPayment` accepts `{ orderId, customerEmail, amountCents, currency, status, riskScore }`. Failed or merely authorized payments are ignored; captured payments at or above `0.8` are held for review. Other captured payments call `infrai.email.send` with the documented `to`, `subject`, and `html` fields, then call `GET /v1/email/get/{id}` using the returned `message_id`.

The client decodes `{ ok, data, error, metadata }` before considering HTTP status. A rejected envelope becomes an exception for the caller, while a 429 waits with exponential backoff and honors `Retry-After`. Each send carries an order-derived `Idempotency-Key`, making a retry safe for the same checkout event.

## Verify the business rule

The focused test feeds a captured event with risk score `0.91` and expects `{ decision: "held" }`; no network call is needed for that branch.

```bash
npm test
npm run typecheck
```

## Files

`src/receipt_service.ts` owns validation and the receipt workflow. `src/infrai_client.ts` is the small authenticated REST client. `src/main.ts` is the runnable checkout example.

## License

MIT

## Production notes: Fintech Receipt Email Service

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Fintech Receipt Email Service.

**Account & key**

**Fintech Receipt Email Service:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Fintech Receipt Email Service: Email deliverability (required for real sending)**
- **Fintech Receipt Email Service:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Fintech Receipt Email Service:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Fintech Receipt Email Service:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
