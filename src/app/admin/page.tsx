import Link from "next/link";
import { ArrowRight, HandHeart, Link as LinkIcon, UserRound } from "lucide-react";

import { AamemLogo } from "@/components/brand/aamem-logo";
import { AdminPrayerQrCode } from "@/components/templates/admin-home-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  adminTenantHref,
  formatAdminDate,
  getAdminContext,
  getRandomAdminGreeting,
  type AdminSearchParams,
} from "@/lib/admin/context";
import { listOwnerPrayerRequests } from "@/lib/tenants/data";

type AdminPageProps = {
  searchParams: AdminSearchParams;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { user, selectedTenant, displayName, displayEmail } =
    await getAdminContext(searchParams);
  const prayerRequests = await listOwnerPrayerRequests({
    tenant: selectedTenant.tenant,
    ownerUid: user.uid,
  });
  const latestPrayerRequest = prayerRequests[0];
  const randomGreeting = getRandomAdminGreeting();

  const summaryCards = [
    {
      title: "Dados pessoais",
      description: "Nome, e-mail da conta e opção de exclusão.",
      href: adminTenantHref("/admin/dados", selectedTenant.tenant),
      icon: UserRound,
      stats: [
        { label: "Nome", value: displayName },
        { label: "E-mail", value: displayEmail },
      ],
      cta: "entrar nos dados",
    },
    {
      title: "Pedidos de oração",
      description: "Lista completa e impressão dos pedidos recebidos.",
      href: adminTenantHref("/admin/pedidos", selectedTenant.tenant),
      icon: HandHeart,
      stats: [
        {
          label: "Recebidos",
          value:
            prayerRequests.length === 1
              ? "1 pedido"
              : `${prayerRequests.length} pedidos`,
        },
        {
          label: "Último pedido",
          value: latestPrayerRequest
            ? formatAdminDate(latestPrayerRequest.createdAt)
            : "nenhum ainda",
        },
      ],
      cta: "entrar nos pedidos",
    },
    {
      title: "Link da bio",
      description: "Admin do minisite, tema, logo e publicação.",
      href: adminTenantHref("/admin/link-da-bio", selectedTenant.tenant),
      icon: LinkIcon,
      stats: [
        { label: "Instituição", value: selectedTenant.institutionName },
        {
          label: "Status",
          value: selectedTenant.status === "published" ? "publicado" : "rascunho",
        },
      ],
      cta: "entrar no minisite",
    },
  ];

  return (
    <main className="min-h-svh bg-background px-5 py-7 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-7">
        <header className="space-y-5">
          <AamemLogo priority className="h-auto w-28" />
          <div className="space-y-2">
            <Badge variant="secondary" className="h-6 rounded-lg">
              admin
            </Badge>
            <h1 className="text-3xl leading-tight text-brand-cocoa sm:text-4xl">
              Olá, {displayName}! {randomGreeting}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-brand-lavender">
              Acompanhe os dados da sua igreja.
            </p>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3" aria-label="Áreas do admin">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Card className="h-full transition-colors group-hover:bg-muted/60">
                  <CardHeader>
                    <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-secondary text-brand-indigo">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-5">
                    <dl className="grid gap-3 text-sm">
                      {card.stats.map((stat) => (
                        <div
                          key={stat.label}
                          className="flex items-start justify-between gap-4"
                        >
                          <dt className="text-muted-foreground">{stat.label}</dt>
                          <dd className="max-w-[12rem] truncate text-right text-brand-cocoa">
                            {stat.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <span className="inline-flex items-center gap-1.5 text-sm text-brand-indigo">
                      {card.cta}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </section>

        <AdminPrayerQrCode
          institutionName={selectedTenant.institutionName}
          prayerRequestPath={`/${selectedTenant.tenant}/pedido-de-oracao`}
        />
      </div>
    </main>
  );
}
