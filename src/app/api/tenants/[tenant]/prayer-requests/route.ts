import { NextResponse } from "next/server";

import {
  enforceRateLimits,
  PRAYER_REQUEST_IP_RULE,
  PRAYER_REQUEST_TENANT_RULE,
} from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import {
  createPrayerRequest,
  TenantError,
  ValidationError,
} from "@/lib/tenants/data";
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
  const denial = await enforceRateLimits([
    {
      key: `prayer-request:ip:${getClientIp(request)}`,
      ...PRAYER_REQUEST_IP_RULE,
    },
    {
      key: `prayer-request:tenant:${tenant}`,
      ...PRAYER_REQUEST_TENANT_RULE,
    },
  ]);

  if (denial) {
    return NextResponse.json(
      { error: "Muitos pedidos em pouco tempo. Tente novamente mais tarde." },
      {
        status: 429,
        headers: { "retry-after": String(denial.retryAfterSeconds) },
      }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    message?: string;
  } | null;

  try {
    const { id, contactToken } = await createPrayerRequest({
      tenant,
      message: body?.message ?? "",
    });

    return NextResponse.json({ ok: true, id, contactToken });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "not-found" ? 404 : 400 }
      );
    }

    return NextResponse.json(
      { error: "Nao foi possivel enviar o pedido." },
      { status: 500 }
    );
  }
}
