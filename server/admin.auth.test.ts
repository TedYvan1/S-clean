import { describe, expect, it, vi } from "vitest";
import { getSupabaseProfileRole } from "./supabaseData";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./supabaseData", async importOriginal => {
  const actual = await importOriginal<typeof import("./supabaseData")>();
  return { ...actual, getSupabaseProfileRole: vi.fn().mockResolvedValue(null) };
});

function createSupabaseContext(): TrpcContext {
  return {
    user: null,
    supabaseUser: { id: "client-user" } as TrpcContext["supabaseUser"],
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("admin.access", () => {
  it("refuses unauthenticated requests", async () => {
    const ctx: TrpcContext = {
      user: null,
      supabaseUser: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.access()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("refuses an authenticated client without an admin role", async () => {
    const caller = appRouter.createCaller(createSupabaseContext());
    await expect(caller.admin.access()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(vi.mocked(getSupabaseProfileRole)).toHaveBeenCalledWith("client-user");
  });
});
