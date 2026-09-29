import { describe, expect, it } from "vitest";

describe("Supabase connection", () => {
  it.skipIf(!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY)("accepts the configured public key", async () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;
    expect(url).toMatch(/^https:\/\//);
    expect(key).toBeTruthy();

    const response = await fetch(`${url!.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: { apikey: key!, Authorization: `Bearer ${key!}` },
    });

    expect(response.status).toBe(200);
  }, 20_000);
});
