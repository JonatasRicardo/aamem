import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { listOwnerTenants } from "@/lib/tenants/data";
import type { MinisiteTheme } from "@/components/templates/create-your-own-flow";

export type AdminSearchParams = Promise<{ tenant?: string }>;

const RANDOM_GREETINGS = [
  "graça e paz <3",
  "paz do Senhor",
  "Um dia abençoado para você",
  "Jesus te ama <3",
];

export async function getAdminContext(searchParams: AdminSearchParams) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const [{ tenant: requestedTenant }, tenants] = await Promise.all([
    searchParams,
    listOwnerTenants(user.uid),
  ]);
  const selectedTenant =
    tenants.find((tenant) => tenant.tenant === requestedTenant) ?? tenants[0];

  if (!selectedTenant) {
    redirect("/");
  }

  return {
    user,
    tenants,
    selectedTenant,
    displayName: user.name ?? "Sem nome informado",
    displayEmail: user.email ?? "sem e-mail",
  };
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
