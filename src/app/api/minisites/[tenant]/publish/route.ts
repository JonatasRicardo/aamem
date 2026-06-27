import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { publishTenantPages, TenantError } from "@/lib/tenants/data";
import { tenantPathTag, tenantTag } from "@/lib/tenants/cache-tags";
import { normalizeTenantSlug } from "@/lib/tenants/paths";

type PublishRouteContext = {
  params: Promise<{ tenant: string }>;
};

export async function POST(_request: Request, { params }: PublishRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Sessao obrigatoria." }, { status: 401 });
  }

  const { tenant: rawTenant } = await params;
  const tenant = normalizeTenantSlug(rawTenant);

  try {
    await publishTenantPages({ tenant, ownerUid: user.uid });

    revalidateTag(tenantTag(tenant), "max");
    for (const path of ["/", "/pedido-de-oracao"]) {
      revalidateTag(tenantPathTag(tenant, path), "max");
      revalidatePath(`/${tenant}${path === "/" ? "" : path}`);
    }

    return NextResponse.json({ published: true });
  } catch (error) {
    if (error instanceof TenantError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Nao foi possivel publicar." },
      { status: 500 }
    );
  }
}
