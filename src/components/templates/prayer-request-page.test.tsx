import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PrayerRequestPage } from "./prayer-request-page";

function renderPrayerRequestPage(
  status?: ComponentProps<typeof PrayerRequestPage>["status"]
) {
  return renderToStaticMarkup(
    <PrayerRequestPage
      status={status}
      institutionName="Igreja da Graça"
      logoUrl="/logo.png"
    />
  );
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

  it("renders the success state with optional contact fields", () => {
    const html = renderPrayerRequestPage("success");

    expect(html).toContain("Pedido de oração enviado.");
    expect(html).toContain("Nós estaremos orando por você.");
    expect(html).toContain("Igreja da Graça");
    expect(html).toContain("Quer que a igreja entre em contato?");
    expect(html).toContain("placeholder=\"seu nome\"");
    expect(html).toContain("placeholder=\"(00) 00000-0000\"");
    expect(html).toContain("quero contato");
    expect(html).toContain("não obrigado");
    expect(html).not.toContain("placeholder=\"escreva aqui seu pedido\"");
  });

  it("renders contact validation and submission feedback", () => {
    const errorHtml = renderToStaticMarkup(
      <PrayerRequestPage
        status="success"
        contactError="Informe um WhatsApp válido para a igreja entrar em contato."
      />
    );
    const successHtml = renderToStaticMarkup(
      <PrayerRequestPage status="success" contactStatus="success" />
    );

    expect(errorHtml).toContain("role=\"alert\"");
    expect(errorHtml).toContain("WhatsApp válido");
    expect(successHtml).toContain("role=\"status\"");
    expect(successHtml).toContain("Contato enviado");
  });

  it("renders the error state feedback", () => {
    const html = renderPrayerRequestPage("error");

    expect(html).toContain("role=\"alert\"");
    expect(html).toContain("Não foi possível enviar");
    expect(html).toContain("Tente novamente em alguns instantes");
    expect(html).toContain("tentar enviar novamente");
  });
});
