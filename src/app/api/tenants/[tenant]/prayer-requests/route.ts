import { NextResponse } from "next/server";

import { createPrayerRequest } from "@/lib/tenants/data";
import { normalizeTenantSlug } from "@/lib/tenants/paths";

type PrayerRequestRouteContext = {
  params: Promise<{ tenant: string }>;
};

export async function POST(
  request: Request,
  { params }: PrayerRequestRouteContext
) {
  const { tenant: rawTenant } = await params;
  const tenant = normalizeTenantSlug(rawTenant);
  const body = (await request.json().catch(() => null)) as {
    message?: string;
  } | null;

  try {
    const id = await createPrayerRequest({
      tenant,
      message: body?.message ?? "",
    });

    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json(
      { error: "Nao foi possivel enviar o pedido." },
      { status: 400 }
    );
  }
}
