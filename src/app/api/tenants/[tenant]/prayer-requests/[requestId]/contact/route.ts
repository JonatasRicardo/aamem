import { NextResponse } from "next/server";

import { addPrayerRequestContact } from "@/lib/tenants/data";
import { normalizeTenantSlug } from "@/lib/tenants/paths";
import { isValidWhatsapp } from "@/lib/phone";

type PrayerRequestContactRouteContext = {
  params: Promise<{ tenant: string; requestId: string }>;
};

export async function POST(
  request: Request,
  { params }: PrayerRequestContactRouteContext
) {
  const { tenant: rawTenant, requestId } = await params;
  const tenant = normalizeTenantSlug(rawTenant);
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    whatsapp?: string;
  } | null;

  if (!isValidWhatsapp(body?.whatsapp ?? "")) {
    return NextResponse.json(
      { error: "WhatsApp invalido." },
      { status: 400 }
    );
  }

  try {
    await addPrayerRequestContact({
      tenant,
      requestId,
      name: body?.name ?? "",
      whatsapp: body?.whatsapp ?? "",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Nao foi possivel salvar o contato." },
      { status: 400 }
    );
  }
}
