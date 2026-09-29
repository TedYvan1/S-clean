import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("account.history", () => {
  it("requires an authenticated Manus user", async () => {
    const ctx: TrpcContext = {
      user: null,
      supabaseUser: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    await expect(appRouter.createCaller(ctx).account.history()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
