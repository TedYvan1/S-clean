export const COOKIE_NAME = "sclean-supabase-access";
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/** Supabase Auth is handled by the account page and server session cookies. */
export const startLogin = () => {
  window.location.assign("/account?mode=login");
};
