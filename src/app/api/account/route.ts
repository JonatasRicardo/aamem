import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase/admin";
import { getCurrentUser, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { tenantTag } from "@/lib/tenants/cache-tags";
import { deleteOwnerTenants } from "@/lib/tenants/data";

export async function DELETE() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Sessao obrigatoria." }, { status: 401 });
  }

  try {
    const deletedTenants = await deleteOwnerTenants(user.uid);

    await getAdminAuth().deleteUser(user.uid);

    for (const tenant of deletedTenants) {
      revalidateTag(tenantTag(tenant), "max");
    }

    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Nao foi possivel excluir a conta." },
      { status: 500 }
    );
  }
}
