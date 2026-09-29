import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { getSupabaseProfileRole } from "../supabaseData";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

const requireSupabaseUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.supabaseUser) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      supabaseUser: ctx.supabaseUser,
    },
  });
});

export const supabaseProtectedProcedure = t.procedure.use(requireSupabaseUser);

const requireSupabaseAdmin = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.supabaseUser) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Connectez-vous pour accéder à l'administration." });
  }

  const role = await getSupabaseProfileRole(ctx.supabaseUser.id);
  if (!role) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Votre compte n'est pas autorisé à accéder à l'administration." });
  }

  return next({
    ctx: {
      ...ctx,
      supabaseUser: ctx.supabaseUser,
      supabaseRole: role,
    },
  });
});

export const supabaseAdminProcedure = t.procedure.use(requireSupabaseAdmin);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
