"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  type AuthDialogState,
  HomeCreateTemplate,
  type SlugStatus,
} from "@/components/templates/create-your-own-flow";
import { signInWithGoogle } from "@/lib/firebase/client";
import {
  isValidTenantSlug,
  normalizeTenantSlugInput,
} from "@/lib/tenants/paths";

type MinisiteResponse = {
  redirectTo?: string;
  error?: string;
};

type CurrentHomeUser = {
  name?: string;
  email?: string;
} | null;

export function CreateYourOwnHomeFlow({
  currentUser,
}: {
  currentUser?: CurrentHomeUser;
}) {
  const router = useRouter();
  const [rawSlug, setRawSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("checking");
  const [authDialogState, setAuthDialogState] =
    useState<AuthDialogState>("closed");
  const [loginStatus, setLoginStatus] = useState<"idle" | "loading">("idle");
  const [isCreatePending, startCreateTransition] = useTransition();
  const [isAdminPending, startAdminTransition] = useTransition();

  const slugInput = useMemo(() => normalizeTenantSlugInput(rawSlug), [rawSlug]);
  const displaySlugStatus: SlugStatus =
    !slugInput || slugInput.length < 3
      ? "idle"
      : !isValidTenantSlug(slugInput)
        ? "unavailable"
        : slugStatus;

  useEffect(() => {
    if (!slugInput || slugInput.length < 3 || !isValidTenantSlug(slugInput)) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSlugStatus("checking");

      try {
        const response = await fetch(`/api/slugs/${slugInput}`, {
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
  }, [slugInput]);

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
        body: JSON.stringify({ tenant: slugInput }),
      });
      const payload = (await minisiteResponse.json()) as MinisiteResponse;

      if (!minisiteResponse.ok || !payload.redirectTo) {
        throw new Error(payload.error ?? "Nao foi possivel criar o minisite.");
      }

      startCreateTransition(() => {
        router.push(payload.redirectTo!);
      });
    } catch {
      setAuthDialogState("closed");
      setSlugStatus("error");
    }
  }

  async function handleLogin() {
    if (loginStatus === "loading") {
      return;
    }

    if (currentUser) {
      startAdminTransition(() => {
        router.push("/admin");
      });
      return;
    }

    setLoginStatus("loading");

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

      startAdminTransition(() => {
        router.push("/admin");
      });
    } catch {
      setLoginStatus("idle");
    }
  }

  return (
    <HomeCreateTemplate
      slug={slugInput}
      slugStatus={displaySlugStatus}
      authDialogState={authDialogState}
      ctaState={isCreatePending ? "loading" : "idle"}
      currentUserName={currentUser?.name ?? currentUser?.email}
      loginState={
        loginStatus === "loading" || isAdminPending ? "loading" : "idle"
      }
      onCreate={handleCreate}
      onLogin={handleLogin}
      onGoogleContinue={handleGoogleContinue}
      onSlugChange={setRawSlug}
    />
  );
}
