import { z } from "zod";
import { infrai } from "./infrai_client.js";

export const paymentEvent = z.object({ orderId: z.string().min(1), customerEmail: z.string().email(), amountCents: z.number().int().positive(), currency: z.string().length(3), status: z.enum(["captured", "authorized", "failed"]), riskScore: z.number().min(0).max(1) });
export type PaymentEvent = z.infer<typeof paymentEvent>;
export type ReceiptResult = { decision: "sent" | "held" | "ignored"; messageId?: string; status?: string };

export async function processPayment(input: unknown): Promise<ReceiptResult> {
  const event = paymentEvent.parse(input);
  if (event.status !== "captured") return { decision: "ignored" };
  if (event.riskScore >= 0.8) return { decision: "held" };
  const sent = await infrai.email.send({ to: event.customerEmail, subject: `Receipt for order ${event.orderId}`, html: `<p>Payment received: ${(event.amountCents / 100).toFixed(2)} ${event.currency}.</p>` }, `receipt-${event.orderId}`);
  const message = await infrai.email.get(sent.message_id);
  return { decision: "sent", messageId: sent.message_id, status: message.status };
}
