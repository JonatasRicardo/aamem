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

  it("renders the account confirmation state after the home CTA", () => {
    const html = renderToStaticMarkup(
      <HomeCreateTemplate
        slug="igreja-da-graca"
        slugStatus="available"
        authDialogState="open"
      />
    );

    expect(html).toContain("Confirme sua conta");
    expect(html).toContain("continuar com Google");
    expect(html).toContain("reservar este link");
    expect(html).not.toContain("Firebase");
  });

  it("renders the account confirmed state", () => {
    const html = renderToStaticMarkup(
      <HomeCreateTemplate
        slug="igreja-da-graca"
        slugStatus="available"
        authDialogState="returning"
      />
    );

    expect(html).toContain("Conta confirmada");
    expect(html).toContain("voltando para o site");
    expect(html).toContain("preparando aamem.com/igreja-da-graca");
  });

  it("renders the authenticated minisite creation mockup", () => {
    const html = renderCreateTemplate();

    expect(html).not.toContain("Firebase");
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
    expect(html).toContain("conta segura");
    expect(html).toContain("Ana Souza");
    expect(html).toContain("ana@igreja.com");
    expect(html).toContain("Pedido de oração");
  });

  it("renders the quick edit minisite editor without onboarding copy", () => {
    const html = renderToStaticMarkup(
      <CreateInstitutionTemplate
        embedded
        quickEdit
        institutionName="Igreja da Graça"
        personName="Ana Souza"
        email="ana@igreja.com"
        slug="igreja-da-graca"
        description="Um espaço simples para receber pedidos de oração."
        submitLabel="publicar alterações"
        submitDisabled
        submitActionContainerClassName="fixed bottom-24 bg-background"
        onSubmit={() => undefined}
      />
    );

    expect(html).toContain("aria-label=\"Editor do minisite\"");
    expect(html).toContain("aria-label=\"Mockup do minisite\"");
    expect(html).toContain("Tema do minisite");
    expect(html).toContain("publicar alterações");
    expect(html).toContain("disabled=\"\"");
    expect(html).toContain("fixed bottom-24 bg-background");
    expect(html).not.toContain("Monte o minisite");
    expect(html).not.toContain("Dados confirmados");
    expect(html).not.toContain("conta segura");
  });

  it.each([
    ["success", "Minisite publicado com sucesso.", "role=\"status\""],
    [
      "error",
      "Não foi possível criar agora. Tente novamente em instantes.",
      "role=\"alert\"",
    ],
  ] as const)(
    "renders fixed submit feedback for the %s state",
    (submitStatus, feedbackText, role) => {
      const html = renderToStaticMarkup(
        <CreateInstitutionTemplate
          embedded
          quickEdit
          institutionName="Igreja da Graça"
          slug="igreja-da-graca"
          description="Um espaço simples para receber pedidos de oração."
          submitLabel="publicar alterações"
          submitStatus={submitStatus}
          submitActionContainerClassName="fixed bottom-24 bg-background"
          onSubmit={() => undefined}
        />
      );

      expect(html).toContain("fixed bottom-24 bg-background");
      expect(html).toContain(feedbackText);
      expect(html).toContain(role);
      expect(html).toContain("publicar alterações");
    }
  );

  it("renders editable fields inside the phone mockup", () => {
    const nameHtml = renderToStaticMarkup(
      <CreateInstitutionTemplate
        institutionName="Igreja da Graça"
        description="Um espaço simples para receber pedidos de oração."
        editableField="institutionName"
      />
    );
    const descriptionHtml = renderToStaticMarkup(
      <CreateInstitutionTemplate
        institutionName="Igreja da Graça"
        description="Um espaço simples para receber pedidos de oração."
        editableField="description"
      />
    );

    expect(nameHtml).toContain("aria-label=\"Nome da instituição\"");
    expect(nameHtml).toContain("value=\"Igreja da Graça\"");
    expect(descriptionHtml).toContain("aria-label=\"Descrição do minisite\"");
    expect(descriptionHtml).toContain(
      "Um espaço simples para receber pedidos de oração."
    );
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
