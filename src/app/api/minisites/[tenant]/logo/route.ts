import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminStorage } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/admin/context";
import { getTenantConfig, saveTenantLogo, TenantError } from "@/lib/tenants/data";
import { tenantTag } from "@/lib/tenants/cache-tags";
import { normalizeTenantSlug } from "@/lib/tenants/paths";

type LogoRouteContext = {
  params: Promise<{ tenant: string }>;
};

export async function GET(_request: Request, { params }: LogoRouteContext) {
  const { tenant: rawTenant } = await params;
  const tenant = normalizeTenantSlug(rawTenant);
  const config = await getTenantConfig(tenant);

  if (!config?.logoPath) {
    return new Response("Logo nao encontrada.", { status: 404 });
  }

  try {
    const [buffer] = await getAdminStorage()
      .bucket()
      .file(config.logoPath)
      .download();

    return new Response(new Uint8Array(buffer), {
      headers: {
        "cache-control": "public, max-age=300",
        "content-type": config.logoPath.endsWith(".png")
          ? "image/png"
          : config.logoPath.endsWith(".webp")
            ? "image/webp"
            : "image/jpeg",
      },
    });
  } catch {
    return new Response("Logo nao encontrada.", { status: 404 });
  }
}

export async function POST(request: Request, { params }: LogoRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Sessao obrigatoria." }, { status: 401 });
  }

  const { tenant: rawTenant } = await params;
  const tenant = normalizeTenantSlug(rawTenant);
  const formData = await request.formData();
  const file = formData.get("logo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Logo ausente." }, { status: 400 });
  }

  try {
    const logoPath = await saveTenantLogo({
      tenant,
      ownerUid: user.uid,
      canAccessAllTenants: isSuperAdmin(user),
      file,
    });

    revalidateTag(tenantTag(tenant), "max");

    return NextResponse.json({ logoPath });
  } catch (error) {
    if (error instanceof TenantError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Nao foi possivel salvar a logo." },
      { status: 500 }
    );
  }
}
