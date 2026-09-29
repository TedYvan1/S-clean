import { createClient, type SupabaseClient, type User as SupabaseUser } from "@supabase/supabase-js";
import type { Request, Response } from "express";

const ACCESS_COOKIE = "sclean-supabase-access";
const REFRESH_COOKIE = "sclean-supabase-refresh";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

let client: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

function getSupabaseUrl() {
  return process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
}

function getSupabaseKey() {
  return process.env.SUPABASE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SECRET_KEY ?? "";
}

export function getSupabaseClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (!client && url && key) {
    client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }
  return client;
}

export function getSupabaseAdminClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();
  if (!adminClient && url && key) {
    adminClient = createClient(url, key, {
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
