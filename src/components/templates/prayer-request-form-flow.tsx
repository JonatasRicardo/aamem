"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { PrayerRequestPage } from "@/components/templates/prayer-request-page";
import { isValidWhatsapp } from "@/lib/phone";

type PrayerStatus = "idle" | "loading" | "success" | "error";

type PrayerRequestResponse = {
  id?: string;
};

export function PrayerRequestFormFlow({
  tenant,
  institutionName,
  logoUrl,
}: {
  tenant: string;
  institutionName: string;
  logoUrl?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<PrayerStatus>("idle");
  const [contactStatus, setContactStatus] = useState<
    "idle" | "loading" | "success"
  >("idle");
  const [contactError, setContactError] = useState<string | undefined>();
  const [requestId, setRequestId] = useState<string | null>(null);

  async function handleSubmit(message: string) {
    setStatus("loading");

    try {
      const response = await fetch(`/api/tenants/${tenant}/prayer-requests`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      const payload = (await response.json()) as PrayerRequestResponse;

      setRequestId(payload.id ?? null);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  async function handleContactSubmit(contact: {
    name: string;
    whatsapp: string;
  }) {
    if (!isValidWhatsapp(contact.whatsapp)) {
      setContactStatus("idle");
      setContactError("Informe um WhatsApp válido para a igreja entrar em contato.");
      return;
    }

    setContactStatus("loading");
    setContactError(undefined);

    if (requestId) {
      const response = await fetch(
        `/api/tenants/${tenant}/prayer-requests/${requestId}/contact`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(contact),
        }
      ).catch(() => null);

      if (!response?.ok) {
        setContactStatus("idle");
        setContactError("Não foi possível enviar seu contato agora.");
        return;
      }
    }

    setContactStatus("success");
    window.setTimeout(() => {
      router.push(`/${tenant}`);
    }, 1400);
  }

  return (
    <PrayerRequestPage
      status={status}
      contactStatus={contactStatus}
      contactError={contactError}
      institutionName={institutionName}
      logoUrl={logoUrl}
      onSubmit={handleSubmit}
      onContactSubmit={handleContactSubmit}
      onSkipContact={() => router.push(`/${tenant}`)}
    />
  );
}
