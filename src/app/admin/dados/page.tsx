import Link from "next/link";
import { ArrowLeft, Mail, UserRound } from "lucide-react";

import { AamemLogo } from "@/components/brand/aamem-logo";
import {
  DeleteAccountButton,
  LogoutButton,
} from "@/components/templates/admin-home-actions";
import { AdminTenantSelector } from "@/components/templates/admin-tenant-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  adminTenantHref,
  getAdminContext,
  type AdminSearchParams,
} from "@/lib/admin/context";

type AdminProfilePageProps = {
  searchParams: AdminSearchParams;
};

export default async function AdminProfilePage({
  searchParams,
}: AdminProfilePageProps) {
  const {
    user,
    tenants,
    selectedTenant,
    selectedTenantOwner,
    canAccessAllTenants,
    displayName,
    displayEmail,
  } = await getAdminContext(searchParams);

  return (
    <main className="min-h-svh bg-background px-5 py-7 text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-5">
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
              dados pessoais
            </Badge>
            <h1 className="text-3xl leading-tight text-brand-cocoa sm:text-4xl">
              Dados pessoais
            </h1>
            <p className="max-w-2xl text-base leading-7 text-brand-lavender">
              Veja os dados da conta usada para administrar seus minisites.
            </p>
          </div>
        </header>

        <AdminTenantSelector
          currentPath="/admin/dados"
          tenants={tenants}
          selectedTenant={selectedTenant}
          selectedTenantOwner={selectedTenantOwner}
          canAccessAllTenants={canAccessAllTenants}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-4" aria-hidden="true" />
              Conta
            </CardTitle>
            <CardDescription>
              O e-mail vem do login e não pode ser alterado por aqui.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <dl className="grid gap-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Nome</dt>
                <dd className="truncate text-right text-brand-cocoa">
                  {displayName}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-3.5" aria-hidden="true" />
                  E-mail
                </dt>
                <dd className="truncate text-right text-brand-cocoa">
                  {displayEmail}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Identificador</dt>
                <dd className="truncate text-right font-mono text-xs text-brand-cocoa">
                  {user.uid}
                </dd>
              </div>
            </dl>

            <Separator />

            <section className="space-y-2" aria-label="Excluir conta">
              <h2 className="text-base leading-tight text-brand-cocoa">
                Excluir conta
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Esta ação apaga seus minisites, pedidos de oração e remove o
                acesso desta conta.
              </p>
              <DeleteAccountButton />
            </section>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
