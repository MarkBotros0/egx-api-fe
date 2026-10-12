/**
 * Site-wide maintenance switch. While true, middleware.ts sends every page
 * request to /maintenance and the nav bars hide.
 *
 * On for the email-accounts rollout (2026-10-12): the web on `master` speaks
 * the new email-login API, so it must stay closed until the backend is
 * deployed and the user reset has run. Flip to false and redeploy to reopen.
 */
export const MAINTENANCE_MODE = true;

export const MAINTENANCE_PATH = "/maintenance";
