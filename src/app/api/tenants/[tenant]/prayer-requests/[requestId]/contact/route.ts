import { NextResponse } from "next/server";

import { isValidWhatsapp } from "@/lib/phone";
import { enforceRateLimits, PRAYER_CONTACT_IP_RULE } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import {
  addPrayerRequestContact,
  TenantError,
  ValidationError,
} from "@/lib/tenants/data";
import { normalizeTenantSlug } from "@/lib/tenants/paths";

type PrayerRequestContactRouteContext = {
  params: Promise<{ tenant: string; requestId: string }>;
};

export async function POST(
  request: Request,
  { params }: PrayerRequestContactRouteContext
) {
  const { tenant: rawTenant, requestId } = await params;
  const tenant = normalizeTenantSlug(rawTenant);
  const denial = await enforceRateLimits([
    {
      key: `prayer-contact:ip:${getClientIp(request)}`,
      ...PRAYER_CONTACT_IP_RULE,
    },
  ]);

  if (denial) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      {
        status: 429,
        headers: { "retry-after": String(denial.retryAfterSeconds) },
      }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    whatsapp?: string;
    token?: string;
  } | null;

  if (!body?.token) {
    return NextResponse.json(
      { error: "Pedido nao identificado." },
      { status: 400 }
    );
  }

  if (!isValidWhatsapp(body.whatsapp ?? "")) {
    return NextResponse.json({ error: "WhatsApp invalido." }, { status: 400 });
  }

  try {
    await addPrayerRequestContact({
      tenant,
      requestId,
      token: body.token,
      name: body.name ?? "",
      whatsapp: body.whatsapp ?? "",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "not-found" ? 404 : 403 }
      );
    }

    return NextResponse.json(
      { error: "Nao foi possivel salvar o contato." },
      { status: 500 }
    );
  }
}
