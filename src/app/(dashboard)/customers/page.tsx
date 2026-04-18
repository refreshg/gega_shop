import Link from "next/link";
import { GoogleCredentialsMissing } from "@/components/features/google-credentials-missing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listCustomersCached } from "@/lib/db/customers";
import { hasGoogleCredentialsConfigured } from "@/lib/googleSheets";
import { formatDate } from "@/lib/utils";
import { CustomerCreateForm } from "./ui/customer-create-form";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  if (!hasGoogleCredentialsConfigured()) {
    return <GoogleCredentialsMissing />;
  }

  const customers = await listCustomersCached();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Stored in the Customers sheet. Personal ID must be unique.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add customer</CardTitle>
          <CardDescription>
            First name, last name, phone, and personal ID are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerCreateForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Directory</CardTitle>
            <CardDescription>{customers.length} customers</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/orders/new">New order</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Personal ID</TableHead>
                <TableHead>Since</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-zinc-500">
                    No customers yet.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.firstName} {c.lastName}
                    </TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell className="font-mono text-sm">{c.personalId}</TableCell>
                    <TableCell className="text-zinc-600">
                      {formatDate(c.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/customers/${c.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
