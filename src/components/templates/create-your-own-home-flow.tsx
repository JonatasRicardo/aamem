"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  type AuthDialogState,
  HomeCreateTemplate,
  type SlugStatus,
} from "@/components/templates/create-your-own-flow";
import { signInWithGoogle } from "@/lib/firebase/client";
import { isValidTenantSlug, normalizeTenantSlug } from "@/lib/tenants/paths";

type MinisiteResponse = {
  redirectTo?: string;
  error?: string;
};

export function CreateYourOwnHomeFlow() {
  const router = useRouter();
  const [rawSlug, setRawSlug] = useState("igreja-da-graca");
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("checking");
  const [authDialogState, setAuthDialogState] =
    useState<AuthDialogState>("closed");
  const [isPending, startTransition] = useTransition();

  const slug = useMemo(() => normalizeTenantSlug(rawSlug), [rawSlug]);
  const displaySlugStatus: SlugStatus =
    !slug || slug.length < 3
      ? "idle"
      : !isValidTenantSlug(slug)
        ? "unavailable"
        : slugStatus;

  useEffect(() => {
    if (!slug || slug.length < 3 || !isValidTenantSlug(slug)) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSlugStatus("checking");

      try {
        const response = await fetch(`/api/slugs/${slug}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          available?: boolean;
        };

        setSlugStatus(payload.available ? "available" : "unavailable");
      } catch {
        if (!controller.signal.aborted) {
          setSlugStatus("error");
        }
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [slug]);

  function handleCreate() {
    if (displaySlugStatus !== "available") {
      return;
    }

    setAuthDialogState("open");
  }

  async function handleGoogleContinue() {
    setAuthDialogState("returning");
    try {
      const { idToken } = await signInWithGoogle();

      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!sessionResponse.ok) {
        throw new Error("Nao foi possivel criar a sessao.");
      }

      const minisiteResponse = await fetch("/api/minisites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenant: slug }),
      });
      const payload = (await minisiteResponse.json()) as MinisiteResponse;

      if (!minisiteResponse.ok || !payload.redirectTo) {
        throw new Error(payload.error ?? "Nao foi possivel criar o minisite.");
      }

      startTransition(() => {
        router.push(payload.redirectTo!);
      });
    } catch {
      setAuthDialogState("closed");
      setSlugStatus("error");
    }
  }

  return (
    <HomeCreateTemplate
      slug={slug}
      slugStatus={displaySlugStatus}
      authDialogState={authDialogState}
      ctaState={isPending ? "loading" : "idle"}
      onCreate={handleCreate}
      onGoogleContinue={handleGoogleContinue}
      onSlugChange={setRawSlug}
    />
  );
}
