import Link from "next/link";
import { ArrowLeft, ExternalLink, HandHeart } from "lucide-react";

import { AdminMinisiteFlow } from "@/components/templates/admin-minisite-flow";
import { Button } from "@/components/ui/button";
import {
  adminTenantHref,
  getAdminContext,
  toTemplateTheme,
  type AdminSearchParams,
} from "@/lib/admin/context";

type AdminBioLinkPageProps = {
  searchParams: AdminSearchParams;
};

export default async function AdminBioLinkPage({
  searchParams,
}: AdminBioLinkPageProps) {
  const { selectedTenant, displayName, displayEmail } =
    await getAdminContext(searchParams);
  const publicMinisiteHref = `/${selectedTenant.tenant}`;
  const publicPrayerHref = `/${selectedTenant.tenant}/pedido-de-oracao`;
  const isPublished = selectedTenant.status === "published";

  return (
    <main className="min-h-svh bg-background px-5 pb-72 pt-5 text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <header>
          <Button asChild variant="ghost" className="h-9 px-0">
            <Link href={adminTenantHref("/admin", selectedTenant.tenant)}>
              <ArrowLeft aria-hidden="true" />
              voltar
            </Link>
          </Button>
        </header>

        <AdminMinisiteFlow
          embedded
          quickEdit
          submitActionContainerClassName={
            isPublished
              ? "fixed inset-x-0 bottom-24 border-t border-border bg-background/95 px-5 py-4 shadow-[0_-12px_40px_rgb(43_29_29/0.08)] backdrop-blur"
              : "fixed inset-x-0 bottom-0 border-t border-border bg-background/95 px-5 py-4 shadow-[0_-12px_40px_rgb(43_29_29/0.08)] backdrop-blur"
          }
          institutionName={selectedTenant.institutionName}
          personName={displayName}
          email={displayEmail}
          slug={selectedTenant.tenant}
          description={selectedTenant.description}
          logoPreviewUrl={
            selectedTenant.logoPath
              ? `/api/minisites/${selectedTenant.tenant}/logo`
              : undefined
          }
          theme={toTemplateTheme(selectedTenant.themeId)}
          isPublished={selectedTenant.status === "published"}
        />

        {isPublished ? (
          <footer className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 px-5 py-4 shadow-[0_-12px_40px_rgb(43_29_29/0.08)] backdrop-blur">
            <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-12 w-full">
                <Link
                  href={publicMinisiteHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink aria-hidden="true" />
                  ver minisite
                </Link>
              </Button>
              <Button asChild className="h-12 w-full">
                <Link
                  href={publicPrayerHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  <HandHeart aria-hidden="true" />
                  pedido de oração
                </Link>
              </Button>
            </div>
          </footer>
        ) : null}
      </div>
    </main>
  );
}
