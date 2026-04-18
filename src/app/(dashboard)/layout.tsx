import { AppShell } from "@/components/features/app-shell";
import { GoogleCredentialsMissing } from "@/components/features/google-credentials-missing";
import { isAdminRole } from "@/lib/auth/require";
import { getSession } from "@/lib/auth/session";
import { hasGoogleCredentialsConfigured } from "@/lib/googleSheets";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!hasGoogleCredentialsConfigured()) {
    return (
      <AppShell
        userName={session?.name}
        showUsersNav={session ? isAdminRole(session.role) : false}
      >
        <GoogleCredentialsMissing />
      </AppShell>
    );
  }

  return (
    <AppShell
      userName={session?.name}
      showUsersNav={session ? isAdminRole(session.role) : false}
    >
      {children}
    </AppShell>
  );
}
