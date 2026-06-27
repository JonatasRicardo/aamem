import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { tenantPathTag, tenantTag } from "@/lib/tenants/cache-tags";
import { isValidTenantSlug } from "@/lib/tenants/paths";

type RevalidatePayload = {
  tenant?: string;
  paths?: string[];
};

export function validateRevalidatePayload(payload: RevalidatePayload | null) {
  if (!payload?.tenant || !isValidTenantSlug(payload.tenant)) {
    return null;
  }

  const paths = payload.paths?.filter((path) => path.startsWith("/")) ?? [];

  if (paths.length === 0) {
    return null;
  }

  return {
    tenant: payload.tenant,
    paths,
  };
}

export async function POST(request: Request) {
  if (request.headers.get("x-revalidate-secret") !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Segredo invalido." }, { status: 401 });
  }

  const payload = validateRevalidatePayload(
    (await request.json().catch(() => null)) as RevalidatePayload | null
  );

  if (!payload) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  revalidateTag(tenantTag(payload.tenant), "max");

  for (const path of payload.paths) {
    revalidateTag(tenantPathTag(payload.tenant, path), "max");
    revalidatePath(`/${payload.tenant}${path === "/" ? "" : path}`);
  }

  return NextResponse.json({ revalidated: true });
}
