export const COOKIE_NAME = "sclean-supabase-access";
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/** Use the admin login flow for staff-only access. */
export const startLogin = () => {
  window.location.assign("/account?mode=login&next=%2Fadmin");
};
