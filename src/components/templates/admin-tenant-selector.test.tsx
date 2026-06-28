import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AdminTenantSelector } from "./admin-tenant-selector";
import type { TenantConfig } from "@/lib/tenants/data";

const tenants = [
  {
    tenant: "igreja-da-graca",
    status: "published",
    ownerUid: "owner-1",
    institutionName: "Igreja da Graça",
    description: "Um espaço simples.",
    themeId: "rose",
  },
  {
    tenant: "comunidade-da-fe",
    status: "draft",
    ownerUid: "owner-2",
    institutionName: "Comunidade da Fé",
    description: "Pedidos de oração.",
    themeId: "indigo",
  },
] satisfies TenantConfig[];

describe("AdminTenantSelector", () => {
  it("does not render for a regular user with only one church", () => {
    const html = renderToStaticMarkup(
      <AdminTenantSelector
        currentPath="/admin"
        tenants={[tenants[0]!]}
        selectedTenant={tenants[0]!}
        selectedTenantOwner={{ uid: "owner-1", email: "ana@igreja.com" }}
        canAccessAllTenants={false}
      />
    );

    expect(html).toBe("");
  });

  it("renders a church selector for a regular user with multiple churches", () => {
    const html = renderToStaticMarkup(
      <AdminTenantSelector
        currentPath="/admin"
        tenants={tenants}
        selectedTenant={tenants[0]!}
        selectedTenantOwner={{ uid: "owner-1", email: "ana@igreja.com" }}
        canAccessAllTenants={false}
      />
    );

    expect(html).toContain("Igreja selecionada");
    expect(html).toContain("Trocar igreja");
    expect(html).toContain("Igreja da Graça /igreja-da-graca");
    expect(html).toContain("Comunidade da Fé /comunidade-da-fe");
    expect(html).toContain("2 igrejas");
    expect(html).toContain("ana@igreja.com");
  });

  it("renders superadmin context with every tenant owner", () => {
    const html = renderToStaticMarkup(
      <AdminTenantSelector
        currentPath="/admin/link-da-bio"
        tenants={tenants}
        selectedTenant={tenants[1]!}
        selectedTenantOwner={{ uid: "owner-2" }}
        canAccessAllTenants
      />
    );

    expect(html).toContain("superadmin");
    expect(html).toContain("2 usuários");
    expect(html).toContain("dono owner-1");
    expect(html).toContain("dono owner-2");
  });
});
