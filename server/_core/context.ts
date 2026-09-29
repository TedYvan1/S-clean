import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getSupabaseUser } from "../supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  supabaseUser: SupabaseUser | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let supabaseUser: SupabaseUser | null = null;
  try {
    supabaseUser = await getSupabaseUser(opts.req);
  } catch {
    supabaseUser = null;
  }
  return { req: opts.req, res: opts.res, user: null, supabaseUser };
}
