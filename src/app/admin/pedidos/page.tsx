import Link from "next/link";
import { ArrowLeft, HandHeart } from "lucide-react";

import { AamemLogo } from "@/components/brand/aamem-logo";
import {
  LogoutButton,
  PrintPrayerRequestsButton,
} from "@/components/templates/admin-home-actions";
import { AdminTenantSelector } from "@/components/templates/admin-tenant-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  adminTenantHref,
  formatAdminDate,
  getAdminContext,
  type AdminSearchParams,
} from "@/lib/admin/context";
import { listOwnerPrayerRequests } from "@/lib/tenants/data";

type AdminPrayerRequestsPageProps = {
  searchParams: AdminSearchParams;
};

export default async function AdminPrayerRequestsPage({
  searchParams,
}: AdminPrayerRequestsPageProps) {
  const {
    user,
    tenants,
    selectedTenant,
    selectedTenantOwner,
    canAccessAllTenants,
  } = await getAdminContext(searchParams);
  const prayerRequests = await listOwnerPrayerRequests({
    tenant: selectedTenant.tenant,
    ownerUid: user.uid,
    canAccessAllTenants,
  });

  return (
    <main className="min-h-svh bg-background px-5 py-7 text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="admin-print-hidden space-y-5">
          <div className="flex items-start justify-between gap-4">
            <AamemLogo priority className="h-auto w-28" />
            <LogoutButton />
          </div>
          <div>
            <Button asChild variant="ghost" className="h-9 px-0">
              <Link href={adminTenantHref("/admin", selectedTenant.tenant)}>
                <ArrowLeft aria-hidden="true" />
                voltar
              </Link>
            </Button>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary" className="h-6 rounded-lg">
              pedidos de oração
            </Badge>
            <h1 className="text-3xl leading-tight text-brand-cocoa sm:text-4xl">
              Pedidos de oração
            </h1>
            <p className="max-w-2xl text-base leading-7 text-brand-lavender">
              Consulte todos os pedidos recebidos e imprima a lista completa.
            </p>
          </div>
        </header>

        <div className="admin-print-hidden">
          <AdminTenantSelector
            currentPath="/admin/pedidos"
            tenants={tenants}
            selectedTenant={selectedTenant}
            selectedTenantOwner={selectedTenantOwner}
            canAccessAllTenants={canAccessAllTenants}
          />
        </div>

        <Card className="admin-print-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandHeart className="size-4" aria-hidden="true" />
              Lista de pedidos
            </CardTitle>
            <CardDescription>
              {prayerRequests.length}{" "}
              {prayerRequests.length === 1
                ? "pedido recebido"
                : "pedidos recebidos"}
            </CardDescription>
            <CardAction className="admin-print-hidden">
              <PrintPrayerRequestsButton disabled={prayerRequests.length === 0} />
            </CardAction>
          </CardHeader>
          <CardContent>
            {prayerRequests.length > 0 ? (
              <ol className="space-y-3">
                {prayerRequests.map((request, index) => (
                  <li
                    key={request.id}
                    className="rounded-lg border border-border bg-white/70 p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="font-mono text-xs text-muted-foreground">
                        Pedido {index + 1} · {formatAdminDate(request.createdAt)}
                      </p>
                      {request.wantsContact ? (
                        <Badge variant="secondary">quer contato</Badge>
                      ) : null}
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-brand-cocoa">
                      {request.message}
                    </p>
                    {request.contactName || request.contactWhatsapp ? (
                      <div className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm leading-6 text-muted-foreground">
                        {request.contactName ? (
                          <p>Nome: {request.contactName}</p>
                        ) : null}
                        {request.contactWhatsapp ? (
                          <p>WhatsApp: {request.contactWhatsapp}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
                <p className="text-sm leading-6 text-muted-foreground">
                  Nenhum pedido de oração chegou ainda.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
