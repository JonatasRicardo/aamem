import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AdminPrayerQrCode, LogoutButton } from "./admin-home-actions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe("AdminPrayerQrCode", () => {
  it("renders the prayer request QR button", () => {
    const html = renderToStaticMarkup(
      <AdminPrayerQrCode
        institutionName="Igreja da Graça"
        prayerRequestPath="/igreja-da-graca/pedido-de-oracao"
      />
    );

    expect(html).toContain("QR Code");
    expect(html).toContain("copiar link");
    expect(html).not.toContain("QR Code Pedido de Oração");
    expect(html).not.toContain("/igreja-da-graca/pedido-de-oracao");
    expect(html).not.toContain("baixar QR");
  });
});

describe("LogoutButton", () => {
  it("renders the admin logout action", () => {
    const html = renderToStaticMarkup(<LogoutButton />);

    expect(html).toContain("sair");
  });
});
