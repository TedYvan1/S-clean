import { describe, expect, it } from "vitest";

describe("Supabase database connection", () => {
  it.skipIf(!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)("accepts the server-only service role key on REST", async () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(url).toMatch(/^https:\/\//);
    expect(key).toBeTruthy();

    const response = await fetch(`${url!.replace(/\/$/, "")}/rest/v1/`, {
      headers: { apikey: key!, Authorization: `Bearer ${key!}` },
    });

    expect(response.status).toBe(200);
  }, 20_000);
});
