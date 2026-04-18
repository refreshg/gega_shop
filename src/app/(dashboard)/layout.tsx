import { AppShell } from "@/components/features/app-shell";
import { GoogleCredentialsMissing } from "@/components/features/google-credentials-missing";
import { hasGoogleCredentialsConfigured } from "@/lib/googleSheets";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasGoogleCredentialsConfigured()) {
    return (
      <AppShell>
        <GoogleCredentialsMissing />
      </AppShell>
    );
  }

  return <AppShell>{children}</AppShell>;
}
