import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AdminPrayerQrCode } from "./admin-home-actions";

describe("AdminPrayerQrCode", () => {
  it("renders the prayer request QR generator", () => {
    const html = renderToStaticMarkup(
      <AdminPrayerQrCode
        institutionName="Igreja da Graça"
        prayerRequestPath="/igreja-da-graca/pedido-de-oracao"
      />
    );

    expect(html).toContain("QR Code Pedido de Oração");
    expect(html).toContain("Igreja da Graça");
    expect(html).toContain("/igreja-da-graca/pedido-de-oracao");
    expect(html).toContain("copiar link");
    expect(html).toContain("gerar QR Code");
    expect(html).not.toContain("baixar");
  });
});
