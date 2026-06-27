import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  CreateInstitutionTemplate,
  HomeCreateTemplate,
  InstitutionBioTemplate,
} from "@/components/templates/create-your-own-flow";

const LOGO_PREVIEW_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'%3E%3Crect width='160' height='160' rx='80' fill='%23f3eeee'/%3E%3Cpath d='M80 32c19 20 33 36 33 57 0 19-14 34-33 39-19-5-33-20-33-39 0-21 14-37 33-57Z' fill='%23231169'/%3E%3Cpath d='M80 57c10 10 18 19 18 31 0 10-7 18-18 22-11-4-18-12-18-22 0-12 8-21 18-31Z' fill='%239e6c6c'/%3E%3C/svg%3E";

const createArgs = {
  institutionName: "Igreja da Graça",
  personName: "Ana Souza",
  email: "ana@igreja.com",
  slug: "igreja-da-graca",
  description:
    "Um espaço simples para receber pedidos de oração e caminhar junto em fé.",
  logoPreviewUrl: LOGO_PREVIEW_URL,
};

const meta = {
  title: "Templates/Criar o seu",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const HomeComCta: Story = {
  render: () => (
    <HomeCreateTemplate slug="igreja-da-graca" slugStatus="available" />
  ),
};

export const HomeVerificandoSlug: Story = {
  render: () => (
    <HomeCreateTemplate slug="igreja-da-graca" slugStatus="checking" />
  ),
};

export const HomeSlugIndisponivel: Story = {
  render: () => (
    <HomeCreateTemplate slug="igreja-central" slugStatus="unavailable" />
  ),
};

export const HomeErroSlug: Story = {
  render: () => <HomeCreateTemplate slug="igreja-da-graca" slugStatus="error" />,
};

export const HomeConfirmarConta: Story = {
  render: () => (
    <HomeCreateTemplate
      slug="igreja-da-graca"
      slugStatus="available"
      authDialogState="open"
    />
  ),
};

export const HomeContaConfirmada: Story = {
  render: () => (
    <HomeCreateTemplate
      slug="igreja-da-graca"
      slugStatus="available"
      authDialogState="returning"
    />
  ),
};

export const CriacaoMinisite: Story = {
  render: () => <CreateInstitutionTemplate {...createArgs} />,
};

export const CriacaoTemaIndigo: Story = {
  render: () => <CreateInstitutionTemplate {...createArgs} theme="indigo" />,
};

export const CriacaoEnviando: Story = {
  render: () => (
    <CreateInstitutionTemplate
      {...createArgs}
      submitStatus="loading"
    />
  ),
};

export const MinisitePublicado: Story = {
  render: () => (
    <InstitutionBioTemplate
      institutionName="Igreja da Graça"
      slug="igreja-da-graca"
      description={createArgs.description}
      logoUrl={LOGO_PREVIEW_URL}
      prayerRequestHref="/igreja-da-graca/pedido-de-oracao"
    />
  ),
};
