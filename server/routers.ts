import { z } from "zod";
import { clearSupabaseSession, getSupabaseClient, setSupabaseSession } from "./supabase";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router, supabaseAdminProcedure, supabaseProtectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { createSupabaseBooking, getSupabaseProfileRole, listAdminBookings, listAdminServices, listSupabaseBookingsForDate, listSupabaseHistory, listSupabaseServices, syncSupabaseProfile, updateSupabaseBookingStatus } from "./supabaseData";

function bookingError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  if (/SLOT_UNAVAILABLE|duplicate key|unique/i.test(message)) throw new TRPCError({ code: "CONFLICT", message: "Ce créneau vient d'être réservé. Choisissez un autre horaire." });
  if (/column .* does not exist/i.test(message)) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Le schéma de la base de données est incomplet (colonne manquante). Appliquez les migrations SQL / exécutez supabase/schema.sql." });
  if (/SERVICE_UNAVAILABLE/i.test(message)) throw new TRPCError({ code: "NOT_FOUND", message: "Cette formule n'est plus disponible." });
  if (/ZONE_UNAVAILABLE|OUTSIDE_HOURS/i.test(message)) throw new TRPCError({ code: "BAD_REQUEST", message: "Cette zone ou cet horaire n'est pas disponible." });
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La réservation n'a pas pu être enregistrée." });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.supabaseUser),
    supabaseMe: publicProcedure.query(({ ctx }) => ctx.supabaseUser),
    supabaseRole: supabaseProtectedProcedure.query(({ ctx }) => getSupabaseProfileRole(ctx.supabaseUser.id)),
    signUp: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(8), fullName: z.string().min(2), phone: z.string().optional() })).mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Supabase n'est pas configuré." });
      const { data, error } = await supabase.auth.signUp({ email: input.email, password: input.password, options: { data: { full_name: input.fullName, phone: input.phone ?? null } } });
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      if (data.session) setSupabaseSession(ctx.res, data.session.access_token, data.session.refresh_token);
      if (data.user) await syncSupabaseProfile(data.user);
      return { user: data.user, requiresEmailConfirmation: !data.session };
    }),
    signIn: publicProcedure.input(z.object({ identifier: z.string().min(3), password: z.string().min(1) })).mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Supabase n'est pas configuré." });
      const credentials = input.identifier.includes("@") ? { email: input.identifier, password: input.password } : { phone: input.identifier, password: input.password };
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      if (error || !data.session) throw new TRPCError({ code: "UNAUTHORIZED", message: "Identifiant ou mot de passe incorrect." });
      setSupabaseSession(ctx.res, data.session.access_token, data.session.refresh_token);
      await syncSupabaseProfile(data.user);
      return { user: data.user };
    }),
    signOut: publicProcedure.mutation(({ ctx }) => { clearSupabaseSession(ctx.res); return { success: true } as const; }),
    oauthUrl: publicProcedure.input(z.object({ provider: z.enum(["google", "apple"]) })).query(async ({ input, ctx }) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Supabase n'est pas configuré." });
      const origin = `${ctx.req.protocol}://${ctx.req.get("host")}`;
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: input.provider, options: { redirectTo: `${origin}/auth/callback` } });
      if (error || !data.url) throw new TRPCError({ code: "BAD_REQUEST", message: error?.message ?? "Le fournisseur OAuth n'est pas disponible." });
      return { url: data.url };
    }),
    setSession: publicProcedure.input(z.object({ accessToken: z.string().min(20), refreshToken: z.string().optional() })).mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Supabase n'est pas configuré." });
      const { data, error } = await supabase.auth.getUser(input.accessToken);
      if (error || !data.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Session Supabase invalide." });
      setSupabaseSession(ctx.res, input.accessToken, input.refreshToken);
      await syncSupabaseProfile(data.user);
      return { user: data.user };
    }),
    logout: publicProcedure.mutation(({ ctx }) => { const options = getSessionCookieOptions(ctx.req); ctx.res.clearCookie("app_session_id", { ...options, maxAge: -1 }); return { success: true } as const; }),
  }),
  account: router({
    history: protectedProcedure.query(() => []),
    supabaseHistory: supabaseProtectedProcedure.query(async ({ ctx }) => (await listSupabaseHistory(ctx.supabaseUser.id)) ?? []),
  }),
  admin: router({
    access: supabaseAdminProcedure.query(({ ctx }) => ({ user: ctx.supabaseUser, role: ctx.supabaseRole })),
    bookings: supabaseAdminProcedure.query(() => listAdminBookings()),
    updateBookingStatus: supabaseAdminProcedure.input(z.object({ bookingNumber: z.string().min(3), status: z.enum(["pending", "confirmed", "completed", "cancelled", "in_progress", "no_show"]) })).mutation(({ input }) => updateSupabaseBookingStatus(input.bookingNumber, input.status)),
    services: supabaseAdminProcedure.query(() => listAdminServices()),
  }),
  services: router({ list: publicProcedure.query(() => listSupabaseServices()) }),
  availability: router({
    slots: publicProcedure.input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), durationMinutes: z.number().int().positive() })).query(async ({ input }) => {
      const existing = await listSupabaseBookingsForDate(input.date);
      if (existing === null) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Les disponibilités sont momentanément indisponibles." });
      const result: Array<{ time: string; status: "available" | "reserved" | "pause" }> = [];
      for (let start = 8 * 60; start + input.durationMinutes <= 18 * 60; start += 60) {
        const end = start + input.durationMinutes;
        const overlapsPause = start >= 12 * 60 + 30 && start < 13 * 60 && end > 12 * 60;
        const overlaps = existing.some((b) => { const a = b.startTime.split(":").map(Number); const z = b.endTime.split(":").map(Number); const bs = a[0] * 60 + a[1]; const be = z[0] * 60 + z[1]; return start < be + 30 && end + 30 > bs; });
        result.push({ time: `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`, status: overlapsPause ? "pause" : overlaps ? "reserved" : "available" });
      }
      return result;
    }),
  }),
  bookings: router({
    create: publicProcedure.input(z.object({ serviceId: z.number().int().positive(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), startTime: z.string().regex(/^\d{2}:\d{2}$/), customerName: z.string().min(2), phone: z.string().min(6), vehicle: z.string().min(2), address: z.string().min(5), neighborhood: z.string().min(2), landmark: z.string().max(160).optional() })).mutation(async ({ input, ctx }) => {
      const bookingNumber = `SC-${input.date.replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      try {
        const row = await createSupabaseBooking(ctx.supabaseUser, bookingNumber, input);
        return { bookingNumber: row.booking_number, status: row.status, totalPrice: row.total_price };
      } catch (error) { return bookingError(error); }
    }),
  }),
});

export type AppRouter = typeof appRouter;
