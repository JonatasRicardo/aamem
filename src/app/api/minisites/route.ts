import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { createDraftTenant, TenantError } from "@/lib/tenants/data";
import {
  isValidTenantSlug,
  normalizeTenantSlug,
} from "@/lib/tenants/paths";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Sessao obrigatoria." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    tenant?: string;
    institutionName?: string;
    description?: string;
    themeId?: string;
  } | null;
  const tenant = normalizeTenantSlug(body?.tenant ?? "");

  if (!isValidTenantSlug(tenant)) {
    return NextResponse.json({ error: "Link invalido." }, { status: 400 });
  }

  try {
    await createDraftTenant({
      tenant,
      ownerUid: user.uid,
      institutionName: body?.institutionName,
      description: body?.description,
      themeId: body?.themeId,
    });

    return NextResponse.json({
      tenant,
      redirectTo: `/admin?tenant=${tenant}`,
    });
  } catch (error) {
    if (error instanceof TenantError && error.code === "tenant-taken") {
      return NextResponse.json(
        { error: "Este link ja esta em uso." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Nao foi possivel criar o minisite." },
      { status: 500 }
    );
  }
}
