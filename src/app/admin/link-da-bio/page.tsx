import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AdminMinisiteFlow } from "@/components/templates/admin-minisite-flow";
import { AdminTenantSelector } from "@/components/templates/admin-tenant-selector";
import { LogoutButton } from "@/components/templates/admin-home-actions";
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
  const {
    tenants,
    selectedTenant,
    selectedTenantOwner,
    canAccessAllTenants,
    displayName,
    displayEmail,
  } = await getAdminContext(searchParams);

  return (
    <main className="min-h-svh bg-background px-5 pb-44 pt-5 text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <header className="flex items-start justify-between gap-4">
          <Button asChild variant="ghost" className="h-9 px-0">
            <Link href={adminTenantHref("/admin", selectedTenant.tenant)}>
              <ArrowLeft aria-hidden="true" />
              voltar
            </Link>
          </Button>
          <LogoutButton />
        </header>

        <AdminTenantSelector
          currentPath="/admin/link-da-bio"
          tenants={tenants}
          selectedTenant={selectedTenant}
          selectedTenantOwner={selectedTenantOwner}
          canAccessAllTenants={canAccessAllTenants}
        />

        <AdminMinisiteFlow
          embedded
          quickEdit
          submitActionContainerClassName="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 px-5 py-4 shadow-[0_-12px_40px_rgb(43_29_29/0.08)] backdrop-blur"
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
      </div>
    </main>
  );
}
