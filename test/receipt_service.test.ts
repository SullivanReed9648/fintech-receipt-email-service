import assert from "node:assert/strict";
import test from "node:test";
import { processPayment } from "../src/receipt_service.js";

test("high-risk captured payment is held before any email call", async () => {
  const result = await processPayment({ orderId: "RISK-1", customerEmail: "buyer@example.com", amountCents: 1000, currency: "USD", status: "captured", riskScore: 0.91 });
  assert.deepEqual(result, { decision: "held" });
});
