/** @type {import('next').NextConfig} */
const nextConfig = {
  // FE_BASE_URL is read by a CLIENT component (PasswordRevealDialog), and Next
  // only ships `NEXT_PUBLIC_*` names to the browser by default. Listing it here
  // inlines it at build time under its own name, so the variable stays spelled
  // `FE_BASE_URL` in .env and in the Vercel dashboard.
  //
  // It is a public URL, not a secret — it is the address of the login page.
  env: {
    FE_BASE_URL: process.env.FE_BASE_URL,
  },
};

module.exports = nextConfig;
