import type { Metadata } from "next";

import { PrayerRequestPage } from "@/components/templates/prayer-request-page";

export const metadata: Metadata = {
  title: "Pedido de oração | aamém",
  description: "Template de pedido de oração para minisites de igrejas.",
};

export default function PrayerRequestTemplateRoute() {
  return <PrayerRequestPage />;
}

