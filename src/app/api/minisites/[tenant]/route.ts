import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/admin/context";
import { tenantTag } from "@/lib/tenants/cache-tags";
import { TenantError, updateTenantConfig } from "@/lib/tenants/data";
import { normalizeTenantSlug } from "@/lib/tenants/paths";

type MinisiteRouteContext = {
  params: Promise<{ tenant: string }>;
};

export async function PATCH(request: Request, { params }: MinisiteRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Sessao obrigatoria." }, { status: 401 });
  }

  const { tenant: rawTenant } = await params;
  const tenant = normalizeTenantSlug(rawTenant);
  const body = (await request.json().catch(() => null)) as {
    institutionName?: string;
    description?: string;
    themeId?: string;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  try {
    await updateTenantConfig({
      tenant,
      ownerUid: user.uid,
      canAccessAllTenants: isSuperAdmin(user),
      institutionName: body.institutionName,
      description: body.description,
      themeId: body.themeId,
    });

    revalidateTag(tenantTag(tenant), "max");

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TenantError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Nao foi possivel salvar o minisite." },
      { status: 500 }
    );
  }
}
