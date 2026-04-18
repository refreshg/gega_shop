import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SheetLoadError({
  title,
  error,
}: {
  title: string;
  error: unknown;
}) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-pretty text-zinc-700 dark:text-zinc-300">
            {message}
          </CardDescription>
        </CardHeader>
      </Card>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        If you deploy on Vercel or another host, set{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
          GOOGLE_SERVICE_ACCOUNT_EMAIL
        </code>{" "}
        and{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
          GOOGLE_PRIVATE_KEY
        </code>{" "}
        in project settings. A local file path for credentials does not work on
        the serverless runtime.
      </p>
    </div>
  );
}
