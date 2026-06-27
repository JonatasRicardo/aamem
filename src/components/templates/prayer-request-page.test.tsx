import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PrayerRequestPage } from "./prayer-request-page";

function renderPrayerRequestPage(
  status?: ComponentProps<typeof PrayerRequestPage>["status"]
) {
  return renderToStaticMarkup(<PrayerRequestPage status={status} />);
}

describe("PrayerRequestPage", () => {
  it("renders the default prayer request form", () => {
    const html = renderPrayerRequestPage();

    expect(html).toContain(".Pedido de oração");
    expect(html).toContain("João 14:13-14");
    expect(html).toContain("placeholder=\"escreva aqui seu pedido\"");
    expect(html).toContain("enviar pedido de oração");
    expect(html).not.toContain("disabled=\"\"");
  });

  it("renders the loading state with disabled controls", () => {
    const html = renderPrayerRequestPage("loading");

    expect(html).toContain("enviando pedido");
    expect(html).toContain("aria-busy=\"true\"");
    expect(html).toContain("disabled=\"\"");
  });

  it("renders the success state feedback", () => {
    const html = renderPrayerRequestPage("success");

    expect(html).toContain("role=\"status\"");
    expect(html).toContain("Pedido enviado");
    expect(html).toContain("Recebemos seu pedido de oração");
    expect(html).toContain("pedido enviado");
  });

  it("renders the error state feedback", () => {
    const html = renderPrayerRequestPage("error");

    expect(html).toContain("role=\"alert\"");
    expect(html).toContain("Não foi possível enviar");
    expect(html).toContain("Tente novamente em alguns instantes");
    expect(html).toContain("tentar enviar novamente");
  });
});
