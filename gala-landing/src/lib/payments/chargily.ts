/** Chargily Pay v2: read checkouts to confirm payments without relying on the webhook. */

export function chargilyBaseUrl() {
  return (
    process.env.CHARGILY_API_URL ||
    (process.env.CHARGILY_API_KEY?.startsWith("test_")
      ? "https://pay.chargily.net/test/api/v2"
      : "https://pay.chargily.net/api/v2")
  ).replace(/\/$/, "");
}

export class ChargilyError extends Error {}

async function chargilyGet(path: string): Promise<any | null> {
  if (!process.env.CHARGILY_API_KEY) throw new ChargilyError("CHARGILY_API_KEY is not set on the landing site.");
  const res = await fetch(`${chargilyBaseUrl()}${path}`, {
    headers: { Authorization: `Bearer ${process.env.CHARGILY_API_KEY}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new ChargilyError(`Chargily answered HTTP ${res.status} for ${path}`);
  return res.json();
}

const isPaidFor = (checkout: any, participantId: number) =>
  checkout?.status === "paid" && String(checkout?.metadata?.participantId) === String(participantId);

/**
 * Finds paid checkouts for many participants with few API calls: a stored
 * checkout id is fetched directly; otherwise the checkout list is scanned once.
 */
export class CheckoutIndex {
  private paidByParticipant: Map<string, any> | null = null;

  constructor(private maxPages = 40) {}

  private async scan() {
    if (this.paidByParticipant) return;
    this.paidByParticipant = new Map();
    for (let page = 1; page <= this.maxPages; page++) {
      const data = (await chargilyGet(`/checkouts?per_page=50&page=${page}`)) || {};
      for (const checkout of data.data || []) {
        const pid = String(checkout?.metadata?.participantId ?? "");
        if (pid && checkout.status === "paid" && !this.paidByParticipant.has(pid)) {
          this.paidByParticipant.set(pid, checkout);
        }
      }
      if (page >= (data.last_page || 1)) break;
    }
  }

  async paidCheckout(participantId: number, storedCheckoutId?: string | null) {
    if (storedCheckoutId) {
      const checkout = await chargilyGet(`/checkouts/${storedCheckoutId}`);
      if (isPaidFor(checkout, participantId)) return checkout;
    }
    await this.scan();
    return this.paidByParticipant!.get(String(participantId)) ?? null;
  }
}
