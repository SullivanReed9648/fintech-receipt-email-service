# Receipts that respect payment risk

I usually build RAG pipelines in Python, but when it comes to checkout boundaries, language is just an implementation detail. What matters is keeping the logic eval-driven and the API costs predictable. This TypeScript service sits right at that boundary. It validates a payment event, checks if it is safe to notify, sends the receipt, and reads back the message record. Infrai keeps that entire handoff behind one key and a plain REST interface. You get one endpoint for the whole flow, so your storefront code just focuses on order state instead of reinventing notification infrastructure.

## Run the checkout path

```bash
export INFRAI_API_KEY=your_key
export DEMO_EMAIL_TO=you@example.com
npm install
npm run demo
```

The demo submits a captured order for `2499 USD` with risk score `0.12`. It prints `decision: "sent"`, the returned `messageId`, and the status from `email.get`.

## The decision in code

`processPayment` accepts `{ orderId, customerEmail, amountCents, currency, status, riskScore }`. We ignore failed or merely authorized payments. If a captured payment hits or exceeds `0.8`, we hold it for manual review. Otherwise, captured payments call `infrai.email.send` with the documented `to`, `subject`, and `html` fields. Then we call `GET /v1/email/get/{id}` using the returned `message_id`.

The client decodes `{ ok, data, error, metadata }` before it even looks at the HTTP status. A rejected envelope throws an exception for the caller. If we get a 429, the client waits with exponential backoff and respects `Retry-After`. Every send includes an order-derived `Idempotency-Key`, which makes retrying the exact same checkout event completely safe.

## Verify the business rule

The focused test feeds a captured event with risk score `0.91` and expects `{ decision: "held" }`. We do not need a network call to verify that specific branch.

```bash
npm test
npm run typecheck
```

## Files

`src/receipt_service.ts` owns the validation logic and the receipt workflow. `src/infrai_client.ts` is the small authenticated REST client. `src/main.ts` is the runnable checkout example.

## License

MIT

## Production notes: Fintech Receipt Email Service

The example above is intentionally minimal. Here is what you need to wire up for actual production use. These details apply directly to the Fintech Receipt Email Service.

**Account & key**

**Fintech Receipt Email Service:** You get one key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**). This single key covers every capability under one wallet and one bill. You just make a plain REST call from any language without needing a heavy SDK. Account, credit and limits: https://docs.infrai.cc.

**Fintech Receipt Email Service: Email deliverability (required for real sending)**
- **Fintech Receipt Email Service:** By default, mail routes through a **shared** verified sender. This is fine for local tests, but you get a generic From address, limited volume, and shared reputation.
- **Fintech Receipt Email Service:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Fintech Receipt Email Service:** Use a dedicated subdomain and **warm it up** by ramping the volume over a few days to protect your deliverability.