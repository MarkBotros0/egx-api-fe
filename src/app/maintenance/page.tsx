import { AuthCard } from "../components/AuthCard";

export default function MaintenancePage() {
  return (
    <AuthCard title="Back shortly" subtitle="Borsa Compass is being upgraded.">
      <p className="text-center text-sm leading-6 text-white/60">
        We&apos;re moving sign-in to email accounts, with Google and Apple sign-in. Your
        data is safe — please check back in a little while.
      </p>
    </AuthCard>
  );
}
