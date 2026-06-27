import { redirect } from "next/navigation";

import { AdminMinisiteFlow } from "@/components/templates/admin-minisite-flow";
import type { MinisiteTheme } from "@/components/templates/create-your-own-flow";
import { getCurrentUser } from "@/lib/auth/session";
import { listOwnerTenants } from "@/lib/tenants/data";

type AdminPageProps = {
  searchParams: Promise<{ tenant?: string }>;
};

function toTemplateTheme(themeId: string): MinisiteTheme {
  return themeId === "indigo" ? "indigo" : "rose";
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const [{ tenant: requestedTenant }, tenants] = await Promise.all([
    searchParams,
    listOwnerTenants(user.uid),
  ]);
  const selectedTenant =
    tenants.find((tenant) => tenant.tenant === requestedTenant) ?? tenants[0];

  if (!selectedTenant) {
    redirect("/");
  }

  return (
    <AdminMinisiteFlow
      institutionName={selectedTenant.institutionName}
      personName={user.name ?? user.email ?? "Pessoa autenticada"}
      email={user.email ?? "sem e-mail"}
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
  );
}
