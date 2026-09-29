import { createClient, type SupabaseClient, type User as SupabaseUser } from "@supabase/supabase-js";
import type { Request, Response } from "express";

const ACCESS_COOKIE = "sclean-supabase-access";
const REFRESH_COOKIE = "sclean-supabase-refresh";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

let client: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!client && process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }
  return client;
}

export function getSupabaseAdminClient() {
  if (!adminClient && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    adminClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }
  return adminClient;
}

export async function getSupabaseUser(req: Request): Promise<SupabaseUser | null> {
  const accessToken = readCookie(req.headers.cookie, ACCESS_COOKIE);
  if (!accessToken) return null;
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser(accessToken);
  return error ? null : data.user;
}

function readCookie(header: string | undefined, name: string) {
  if (!header) return undefined;
  const entry = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : undefined;
}

export function setSupabaseSession(res: Response, accessToken: string, refreshToken?: string | null) {
  const options = { httpOnly: true, secure: true, sameSite: "none" as const, path: "/", maxAge: COOKIE_MAX_AGE * 1000 };
  res.cookie(ACCESS_COOKIE, accessToken, options);
  if (refreshToken) res.cookie(REFRESH_COOKIE, refreshToken, options);
}

export function clearSupabaseSession(res: Response) {
  const options = { httpOnly: true, secure: true, sameSite: "none" as const, path: "/", maxAge: -1 };
  res.clearCookie(ACCESS_COOKIE, options);
  res.clearCookie(REFRESH_COOKIE, options);
}

export function getSupabaseAuthCookies() {
  return { access: ACCESS_COOKIE, refresh: REFRESH_COOKIE };
}
