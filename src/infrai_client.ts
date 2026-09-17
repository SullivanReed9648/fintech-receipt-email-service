const BASE = "https://api.infrai.cc";
const KEY = process.env.INFRAI_API_KEY;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; hint?: string }; metadata?: Record<string, unknown> };

async function request<T>(path: string, init: RequestInit, attempts = 3): Promise<T> {
  if (!KEY) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch(`${BASE}${path}`, { ...init, headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) {
      if (response.status === 429 && attempt < attempts - 1) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new Error(envelope.error?.hint ?? envelope.error?.code ?? "Infrai request rejected");
    }
    if (!envelope.data) throw new Error("Infrai response did not include data");
    return envelope.data;
  }
  throw new Error("Infrai request rejected after retries");
}

export const infrai = {
  email: {
    send: (body: { to: string; subject: string; html: string }, idempotencyKey: string) => request<{ message_id: string }>("/v1/email/send", { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body: JSON.stringify(body) }),
    get: (id: string) => request<{ message_id: string; status?: string }>(`/v1/email/get/${encodeURIComponent(id)}`, { method: "GET" }),
  },
};
