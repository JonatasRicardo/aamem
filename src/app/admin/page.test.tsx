import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const selectedTenant = {
  tenant: "noc",
  status: "published" as const,
  ownerUid: "user-1",
  institutionName: "NOC Church",
  description: "Uma igreja para todos.",
  themeId: "rose",
};

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@/components/brand/aamem-logo", () => ({
  AamemLogo: () => <span aria-label="aamém" role="img" />,
}));

vi.mock("@/lib/admin/context", () => ({
  adminTenantHref: (path: string, tenant: string) => `${path}?tenant=${tenant}`,
  formatAdminDate: () => "28/06/2026, 01:00",
  getAdminContext: vi.fn(async () => ({
    user: {
      uid: "user-1",
      email: "jonatas@example.com",
      name: "Jonatas Santos",
      emailVerified: true,
    },
    tenants: [selectedTenant],
    selectedTenant,
    selectedTenantOwner: {
      uid: "user-1",
      email: "jonatas@example.com",
      name: "Jonatas Santos",
    },
    canAccessAllTenants: false,
    displayName: "Jonatas Santos",
    displayEmail: "jonatas@example.com",
  })),
  getRandomAdminGreeting: () => "paz do Senhor",
}));

vi.mock("@/lib/tenants/data", () => ({
  listOwnerPrayerRequests: vi.fn(async () => []),
}));

describe("AdminPage", () => {
  it("renders admin cards in the requested order with updated actions", async () => {
    const { default: AdminPage } = await import("./page");
    const html = renderToStaticMarkup(
      await AdminPage({ searchParams: Promise.resolve({ tenant: "noc" }) })
    );

    const bioIndex = html.indexOf("Link da bio");
    const prayerIndex = html.indexOf("Pedidos de oração");
    const dataIndex = html.indexOf("Dados pessoais");

    expect(bioIndex).toBeGreaterThanOrEqual(0);
    expect(prayerIndex).toBeGreaterThan(bioIndex);
    expect(dataIndex).toBeGreaterThan(prayerIndex);
    expect(html).toContain("editar site");
    expect(html).toContain("ver pedidos");
    expect(html).toContain("acessar dados");
    expect(html).toContain("acessar site");
    expect(html).toContain('href="/noc"');
    expect(html).toContain('href="/admin/link-da-bio?tenant=noc"');
    expect(html).toContain('href="/admin/pedidos?tenant=noc"');
    expect(html).toContain('href="/admin/dados?tenant=noc"');
  });
});
