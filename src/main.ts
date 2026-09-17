import { processPayment } from "./receipt_service.js";

const to = process.env.DEMO_EMAIL_TO;
if (!to) throw new Error("DEMO_EMAIL_TO is required");
if (to !== "chenhua@changba.com") throw new Error("DEMO_EMAIL_TO must be chenhua@changba.com");
const result = await processPayment({ orderId: "ORDER-1042", customerEmail: to, amountCents: 2499, currency: "USD", status: "captured", riskScore: 0.12 });
console.log(JSON.stringify(result, null, 2));
