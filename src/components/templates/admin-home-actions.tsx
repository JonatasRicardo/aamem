"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Printer, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PrintPrayerRequestsButton({
  disabled,
}: {
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-9"
      disabled={disabled}
      onClick={() => window.print()}
    >
      <Printer aria-hidden="true" />
      imprimir todos
    </Button>
  );
}

export function DeleteAccountButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Excluir sua conta vai apagar seus minisites e pedidos de oração. Esta ação não pode ser desfeita."
    );

    if (!confirmed) {
      return;
    }

    setError("");
    startTransition(async () => {
      const response = await fetch("/api/account", { method: "DELETE" });

      if (!response.ok) {
        setError("Não foi possível excluir a conta agora.");
        return;
      }

      router.replace("/");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="destructive"
        className="h-9"
        disabled={isPending}
        onClick={handleDeleteAccount}
      >
        {isPending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 aria-hidden="true" />
        )}
        excluir conta
      </Button>
      {error ? (
        <p className="text-sm leading-6 text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
