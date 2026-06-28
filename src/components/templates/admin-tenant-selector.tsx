import { Building2, ShieldCheck, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TenantConfig } from "@/lib/tenants/data";

type TenantOwnerDisplay = {
  uid: string;
  email?: string;
  name?: string;
};

type AdminTenantSelectorProps = {
  currentPath: string;
  tenants: TenantConfig[];
  selectedTenant: TenantConfig;
  selectedTenantOwner: TenantOwnerDisplay;
  canAccessAllTenants: boolean;
};

export function AdminTenantSelector({
  currentPath,
  tenants,
  selectedTenant,
  selectedTenantOwner,
  canAccessAllTenants,
}: AdminTenantSelectorProps) {
  const ownerCount = new Set(tenants.map((tenant) => tenant.ownerUid)).size;
  const selectedOwnerLabel =
    selectedTenantOwner.email ?? selectedTenantOwner.name ?? selectedTenantOwner.uid;
  const hasTenantSelection = tenants.length > 1;

  if (!hasTenantSelection && !canAccessAllTenants) {
    return null;
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {canAccessAllTenants ? (
            <ShieldCheck className="size-4" aria-hidden="true" />
          ) : (
            <Building2 className="size-4" aria-hidden="true" />
          )}
          Igreja selecionada
        </CardTitle>
        <CardDescription>
          {selectedTenant.institutionName} · aamem.com/{selectedTenant.tenant}
        </CardDescription>
        <CardAction>
          <Badge variant={canAccessAllTenants ? "default" : "secondary"}>
            {canAccessAllTenants ? "superadmin" : `${tenants.length} igrejas`}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          action={currentPath}
          className="grid gap-3 sm:grid-cols-[1fr_auto]"
          method="get"
        >
          <label className="grid gap-2 text-sm">
            <span className="text-muted-foreground">Trocar igreja</span>
            <select
              className="h-11 min-w-0 rounded-lg border border-input bg-white/80 px-3 text-sm text-brand-cocoa outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              defaultValue={selectedTenant.tenant}
              name="tenant"
            >
              {tenants.map((tenant) => (
                <option key={tenant.tenant} value={tenant.tenant}>
                  {tenant.institutionName} /{tenant.tenant}
                  {canAccessAllTenants ? ` · dono ${tenant.ownerUid}` : ""}
                </option>
              ))}
            </select>
          </label>
          <Button className="h-11 self-end" type="submit">
            selecionar
          </Button>
        </form>

        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="text-brand-cocoa">
              {selectedTenant.status === "published" ? "publicado" : "rascunho"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Dono</dt>
            <dd className="truncate text-brand-cocoa">{selectedOwnerLabel}</dd>
          </div>
          {canAccessAllTenants ? (
            <div>
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <UsersRound className="size-3.5" aria-hidden="true" />
                Usuários
              </dt>
              <dd className="text-brand-cocoa">
                {ownerCount === 1 ? "1 usuário" : `${ownerCount} usuários`}
              </dd>
            </div>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}
