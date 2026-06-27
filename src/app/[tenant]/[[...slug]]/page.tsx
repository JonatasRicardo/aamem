import { notFound } from "next/navigation";

import {
  InstitutionBioTemplate,
  type MinisiteTheme,
} from "@/components/templates/create-your-own-flow";
import { PrayerRequestFormFlow } from "@/components/templates/prayer-request-form-flow";
import {
  getAllPublishedPagesForBuild,
  getTenantConfig,
  getTenantPage,
} from "@/lib/tenants/data";
import {
  isValidTenantSlug,
  normalizeTenantSlug,
  pathToSlugSegments,
  slugSegmentsToPath,
} from "@/lib/tenants/paths";

export const dynamicParams = true;
export const revalidate = 300;

type PublicTenantPageProps = {
  params: Promise<{
    tenant: string;
    slug?: string[];
  }>;
};

function toTemplateTheme(themeId: string): MinisiteTheme {
  return themeId === "indigo" ? "indigo" : "rose";
}

export async function generateStaticParams() {
  try {
    const pages = await getAllPublishedPagesForBuild();

    return pages.map((page) => ({
      tenant: page.tenant,
      slug: pathToSlugSegments(page.path),
    }));
  } catch {
    return [];
  }
}

export default async function PublicTenantPage({ params }: PublicTenantPageProps) {
  const { tenant: rawTenant, slug } = await params;
  const tenant = normalizeTenantSlug(rawTenant);

  if (!isValidTenantSlug(tenant)) {
    notFound();
  }

  const path = slugSegmentsToPath(slug);
  const [config, page] = await Promise.all([
    getTenantConfig(tenant),
    getTenantPage(tenant, path),
  ]);

  if (
    !config ||
    !page ||
    config.status !== "published" ||
    page.status !== "published"
  ) {
    notFound();
  }

  if (path === "/pedido-de-oracao") {
    return (
      <PrayerRequestFormFlow
        tenant={tenant}
        institutionName={config.institutionName}
        logoUrl={config.logoPath ? `/api/minisites/${tenant}/logo` : undefined}
      />
    );
  }

  if (path === "/") {
    return (
      <InstitutionBioTemplate
        institutionName={config.institutionName}
        slug={tenant}
        description={config.description}
        logoUrl={config.logoPath ? `/api/minisites/${tenant}/logo` : undefined}
        prayerRequestHref={`/${tenant}/pedido-de-oracao`}
        theme={toTemplateTheme(config.themeId)}
      />
    );
  }

  notFound();
}
