import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  CreateInstitutionTemplate,
  HomeCreateTemplate,
  InstitutionBioTemplate,
  type SlugStatus,
} from "./create-your-own-flow";

function renderCreateTemplate() {
  return renderToStaticMarkup(
    <CreateInstitutionTemplate
      institutionName="Igreja da Graça"
      personName="Ana Souza"
      email="ana@igreja.com"
      slug="igreja-da-graca"
      description="Um espaço simples para receber pedidos de oração."
    />
  );
}

describe("create your own templates", () => {
  it("renders the home CTA", () => {
    const html = renderToStaticMarkup(
      <HomeCreateTemplate slug="igreja-da-graca" slugStatus="available" />
    );

    expect(html).toContain("Escolha seu link");
    expect(html).toContain("aamem.com/");
    expect(html).toContain("igreja-da-graca");
    expect(html).toContain("Link disponível para criar.");
    expect(html).toContain("criar conta");
    expect(html).toContain("Crie uma página simples");
  });

  it.each([
    ["checking", "Verificando disponibilidade do link."],
    ["available", "Link disponível para criar."],
    ["unavailable", "Este link já está em uso."],
    ["error", "Não foi possível verificar agora."],
  ] satisfies Array<[SlugStatus, string]>)(
    "renders the %s slug state on the home",
    (status, text) => {
      const html = renderToStaticMarkup(
        <HomeCreateTemplate slug="igreja-da-graca" slugStatus={status} />
      );

      expect(html).toContain(text);
    }
  );

  it("renders the Firebase popup state after the home CTA", () => {
    const html = renderToStaticMarkup(
      <HomeCreateTemplate
        slug="igreja-da-graca"
        slugStatus="available"
        firebasePopupState="open"
      />
    );

    expect(html).toContain("Firebase Authentication");
    expect(html).toContain("Entrar com Google");
    expect(html).toContain("continuar com Google");
    expect(html).toContain("retorna ao site");
  });

  it("renders the Firebase return state", () => {
    const html = renderToStaticMarkup(
      <HomeCreateTemplate
        slug="igreja-da-graca"
        slugStatus="available"
        firebasePopupState="returning"
      />
    );

    expect(html).toContain("Login confirmado");
    expect(html).toContain("voltando para o site");
    expect(html).toContain("continuar em aamem.com/igreja-da-graca");
  });

  it("renders the authenticated minisite creation mockup", () => {
    const html = renderCreateTemplate();

    expect(html).not.toContain("O Firebase vai cuidar do login");
    expect(html).toContain("Mockup do minisite");
    expect(html).toContain("Monte o minisite");
    expect(html).toContain("Igreja da Graça");
    expect(html).toContain("Um espaço simples para receber pedidos de oração.");
    expect(html).toContain("aamem.com/igreja-da-graca");
    expect(html).toContain("Editar logo da instituição");
    expect(html).toContain("Editar nome da instituição");
    expect(html).toContain("Editar descrição do minisite");
    expect(html).toContain("Tema do minisite");
    expect(html).toContain("claro rose");
    expect(html).toContain("indigo");
    expect(html).toContain("Dados confirmados");
    expect(html).toContain("Ana Souza");
    expect(html).toContain("ana@igreja.com");
    expect(html).toContain("Pedido de oração");
  });

  it("renders the public institution bio page", () => {
    const html = renderToStaticMarkup(
      <InstitutionBioTemplate
        institutionName="Igreja da Graça"
        slug="igreja-da-graca"
        prayerRequestHref="/igreja-da-graca/pedido-de-oracao"
      />
    );

    expect(html).toContain("Igreja da Graça");
    expect(html).toContain("aamem.com/igreja-da-graca");
    expect(html).toContain("Logo da instituição Igreja da Graça");
    expect(html).toContain("href=\"/igreja-da-graca/pedido-de-oracao\"");
    expect(html).toContain("Pedido de oração");
  });
});
