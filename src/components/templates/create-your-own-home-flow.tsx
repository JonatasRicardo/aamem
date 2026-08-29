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
  const [createError, setCreateError] = useState("");
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

    setCreateError("");
    setAuthDialogState("open");
  }

  async function handleGoogleContinue() {
    setCreateError("");
    setAuthDialogState("returning");

    let idToken: string;

    try {
      ({ idToken } = await signInWithGoogle());
    } catch {
      setAuthDialogState("closed");
      setCreateError("Não foi possível entrar com o Google. Tente novamente.");
      return;
    }

    try {
      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!sessionResponse.ok) {
        throw new Error("Não foi possível criar a sessão. Tente novamente.");
      }

      const minisiteResponse = await fetch("/api/minisites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenant: slugInput }),
      });
      const payload = (await minisiteResponse.json().catch(() => ({}))) as
        MinisiteResponse;

      if (!minisiteResponse.ok || !payload.redirectTo) {
        if (minisiteResponse.status === 409) {
          setSlugStatus("unavailable");
        }

        throw new Error(
          payload.error ?? "Não foi possível criar o minisite agora."
        );
      }

      startCreateTransition(() => {
        router.push(payload.redirectTo!);
      });
    } catch (error) {
      setAuthDialogState("closed");
      setCreateError(
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível criar o minisite agora."
      );
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

  function handleSlugChange(nextSlug: string) {
    setCreateError("");
    setRawSlug(nextSlug);
  }

  return (
    <HomeCreateTemplate
      slug={slugInput}
      slugStatus={displaySlugStatus}
      createError={createError}
      authDialogState={authDialogState}
      ctaState={isCreatePending ? "loading" : "idle"}
      currentUserName={currentUser?.name ?? currentUser?.email}
      loginState={
        loginStatus === "loading" || isAdminPending ? "loading" : "idle"
      }
      onCreate={handleCreate}
      onLogin={handleLogin}
      onGoogleContinue={handleGoogleContinue}
      onSlugChange={handleSlugChange}
    />
  );
}
