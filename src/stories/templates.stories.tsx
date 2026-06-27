import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PrayerRequestPage } from "@/components/templates/prayer-request-page";

const meta = {
  title: "Templates/Pedido de oração",
  component: PrayerRequestPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PrayerRequestPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    status: "idle",
  },
};

export const Loading: Story = {
  args: {
    status: "loading",
  },
};

export const Success: Story = {
  args: {
    status: "success",
  },
};

export const Error: Story = {
  args: {
    status: "error",
  },
};
