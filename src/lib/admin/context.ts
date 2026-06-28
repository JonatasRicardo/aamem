import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { getAdminAuth } from "@/lib/firebase/admin";
import { listAllTenants, listOwnerTenants } from "@/lib/tenants/data";
import type { MinisiteTheme } from "@/components/templates/create-your-own-flow";
import type { AuthenticatedUser } from "@/lib/auth/session";

export type AdminSearchParams = Promise<{ tenant?: string }>;

const SUPERADMIN_EMAIL_ENV = "SUPERADMIN_EMAIL";

const RANDOM_GREETINGS = [
  "graça e paz <3",
  "paz do Senhor",
  "Um dia abençoado para você",
  "Jesus te ama <3",
];

export function isSuperAdminEmail(email?: string) {
  const superAdminEmail = process.env[SUPERADMIN_EMAIL_ENV]?.trim().toLowerCase();

  return Boolean(superAdminEmail && email?.trim().toLowerCase() === superAdminEmail);
}

export function isSuperAdmin(user: AuthenticatedUser) {
  return user.emailVerified === true && isSuperAdminEmail(user.email);
}

export async function getAdminContext(searchParams: AdminSearchParams) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const canAccessAllTenants = isSuperAdmin(user);
  const [{ tenant: requestedTenant }, tenants] = await Promise.all([
    searchParams,
    canAccessAllTenants ? listAllTenants() : listOwnerTenants(user.uid),
  ]);
  const selectedTenant =
    tenants.find((tenant) => tenant.tenant === requestedTenant) ?? tenants[0];

  if (!selectedTenant) {
    redirect("/");
  }

  const selectedTenantOwner =
    canAccessAllTenants && selectedTenant.ownerUid !== user.uid
      ? await getTenantOwnerDisplay(selectedTenant.ownerUid)
      : {
          uid: user.uid,
          email: user.email,
          name: user.name,
        };

  return {
    user,
    tenants,
    selectedTenant,
    selectedTenantOwner,
    canAccessAllTenants,
    displayName: user.name ?? "Sem nome informado",
    displayEmail: user.email ?? "sem e-mail",
  };
}

async function getTenantOwnerDisplay(ownerUid: string) {
  try {
    const owner = await getAdminAuth().getUser(ownerUid);

    return {
      uid: owner.uid,
      email: owner.email,
      name: owner.displayName,
    };
  } catch {
    return {
      uid: ownerUid,
      email: undefined,
      name: undefined,
    };
  }
}

export function toTemplateTheme(themeId: string): MinisiteTheme {
  return themeId === "indigo" ? "indigo" : "rose";
}

export function formatAdminDate(date?: Date) {
  if (!date) {
    return "sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export function adminTenantHref(path: string, tenant: string) {
  return `${path}?tenant=${tenant}`;
}

export function getRandomAdminGreeting() {
  return RANDOM_GREETINGS[Math.floor(Math.random() * RANDOM_GREETINGS.length)];
}
