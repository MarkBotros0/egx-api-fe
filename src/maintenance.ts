/**
 * Site-wide maintenance switch. While true, middleware.ts sends every page
 * request to /maintenance and the nav bars hide.
 *
 * On for the email-accounts rollout (2026-10-12): the web on `master` speaks
 * the new email-login API, so it must stay closed until the backend is
 * deployed and the user reset has run. Turned off 2026-10-14 after the rollout.
 */
export const MAINTENANCE_MODE = false;

export const MAINTENANCE_PATH = "/maintenance";
