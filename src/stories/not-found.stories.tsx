import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NotFoundPage } from "@/components/templates/not-found-page";

const meta = {
  title: "Templates/404",
  component: NotFoundPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof NotFoundPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialVerseIndex: 3,
    randomizeOnMount: false,
  },
};
