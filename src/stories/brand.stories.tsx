import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AamemLogo } from "@/components/brand/aamem-logo";

const meta = {
  title: "Design System/Brand",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const colors = [
  { name: "Indigo", value: "#231169" },
  { name: "Cocoa", value: "#2b1d1d" },
  { name: "Lavender", value: "#5a527c" },
  { name: "Rose", value: "#9e6c6c" },
  { name: "White", value: "#ffffff" },
];

export const Logo: Story = {
  render: () => (
    <div className="flex w-[min(520px,80vw)] justify-center">
      <AamemLogo priority className="h-auto w-full max-w-[420px]" />
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="grid w-[min(680px,80vw)] grid-cols-2 gap-4 sm:grid-cols-5">
      {colors.map((color) => (
        <div
          key={color.value}
          className="overflow-hidden rounded-lg border bg-card text-card-foreground"
        >
          <div
            className="aspect-square"
            style={{ backgroundColor: color.value }}
          />
          <div className="space-y-1 p-3">
            <p className="text-sm">{color.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {color.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div className="w-[min(680px,80vw)] space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Adamina</p>
        <h1 className="text-5xl leading-tight text-brand-cocoa">aamém</h1>
      </div>
      <p className="max-w-xl text-xl leading-8 text-brand-lavender">
        Criador de minisites para igrejas, com uma base visual simples,
        acolhedora e fácil de expandir.
      </p>
    </div>
  ),
};
