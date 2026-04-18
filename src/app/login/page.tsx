import { loginWithPin } from "@/actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./ui/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Silver Shop</CardTitle>
          <CardDescription>
            Enter your 4-digit PIN to open the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm action={loginWithPin} />
          <p className="mt-6 text-center text-xs text-zinc-500">
            Users and PINs are stored in the{" "}
            <span className="font-medium">Users</span> sheet. Ask an admin to
            add your account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
