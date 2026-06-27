import { NextResponse } from "next/server";

import { isTenantAvailable } from "@/lib/tenants/data";
import {
  isValidTenantSlug,
  normalizeTenantSlug,
} from "@/lib/tenants/paths";
import { isReservedTenantSlug } from "@/lib/tenants/reserved-slugs";

type SlugRouteContext = {
  params: Promise<{ tenant: string }>;
};

export async function GET(_request: Request, { params }: SlugRouteContext) {
  const { tenant: rawTenant } = await params;
  const tenant = normalizeTenantSlug(rawTenant);

  if (!tenant || !isValidTenantSlug(tenant)) {
    return NextResponse.json({
      tenant,
      available: false,
      reason: isReservedTenantSlug(tenant) ? "reserved" : "invalid",
    });
  }

  try {
    return NextResponse.json({
      tenant,
      available: await isTenantAvailable(tenant),
    });
  } catch {
    return NextResponse.json(
      { tenant, available: false, reason: "error" },
      { status: 500 }
    );
  }
}
