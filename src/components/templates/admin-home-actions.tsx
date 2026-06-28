"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  Check,
  Copy,
  Download,
  X,
  Loader2,
  LogOut,
  Printer,
  QrCode,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export function AdminPrayerQrCode({
  institutionName,
  prayerRequestPath,
  className,
}: {
  institutionName: string;
  prayerRequestPath: string;
  className?: string;
}) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "success">("idle");

  function getPublicUrl() {
    return new URL(prayerRequestPath, window.location.origin).toString();
  }

  async function handleGenerateQrCode() {
    setError("");
    setCopyStatus("idle");
    setIsGenerating(true);

    try {
      const nextPublicUrl = getPublicUrl();
      const nextQrCodeUrl = await QRCode.toDataURL(nextPublicUrl, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 320,
        color: {
          dark: "#2b1d1d",
          light: "#ffffff",
        },
      });

      setPublicUrl(nextPublicUrl);
      setQrCodeUrl(nextQrCodeUrl);
      setIsModalOpen(true);
    } catch {
      setError("Não foi possível gerar o QR Code agora.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopyLink() {
    setError("");

    try {
      const nextPublicUrl = publicUrl || getPublicUrl();

      await navigator.clipboard.writeText(nextPublicUrl);
      setPublicUrl(nextPublicUrl);
      setCopyStatus("success");
      window.setTimeout(() => setCopyStatus("idle"), 2200);
    } catch {
      setError("Não foi possível copiar o link agora.");
    }
  }

  const downloadFileName = `qr-code-pedido-de-oracao-${institutionName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}.png`;

  return (
    <div className={className}>
      <div className="flex min-w-0 justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-9 min-w-0 px-2 bg-background/95 shadow-sm sm:px-2.5"
          onClick={handleCopyLink}
        >
          {copyStatus === "success" ? (
            <Check aria-hidden="true" />
          ) : (
            <Copy aria-hidden="true" />
          )}
          {copyStatus === "success" ? "copiado" : "copiar link"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9 min-w-0 px-2 bg-background/95 shadow-sm sm:px-2.5"
          disabled={isGenerating}
          onClick={handleGenerateQrCode}
        >
          {isGenerating ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <QrCode aria-hidden="true" />
          )}
          QR Code
        </Button>
      </div>
      {error ? (
        <p className="mt-2 text-right text-xs leading-5 text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {isModalOpen && qrCodeUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-cocoa/45 px-5 backdrop-blur-sm">
          <section
            aria-label="QR Code do pedido de oração"
            className="w-full max-w-sm rounded-lg border border-border bg-background p-5 text-center shadow-2xl"
            role="dialog"
          >
            <div className="mb-4 flex items-start justify-between gap-4 text-left">
              <div className="space-y-1">
                <p className="font-mono text-xs text-muted-foreground">
                  aamém
                </p>
                <h2 className="text-xl leading-tight text-brand-cocoa">
                  QR Code Pedido de Oração
                </h2>
                <p className="text-sm leading-6 text-brand-lavender">
                  {institutionName}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Fechar QR Code"
                onClick={() => setIsModalOpen(false)}
              >
                <X aria-hidden="true" />
              </Button>
            </div>

            <Image
              src={qrCodeUrl}
              alt={`QR Code do pedido de oração de ${institutionName}`}
              width={240}
              height={240}
              unoptimized
              className="mx-auto size-60 rounded-lg border border-border bg-white p-3 shadow-sm"
            />
            <p className="mt-4 break-all text-sm leading-6 text-muted-foreground">
              {publicUrl}
            </p>
            <Button asChild className="mt-4 h-10 w-full">
              <a href={qrCodeUrl} download={downloadFileName}>
                <Download aria-hidden="true" />
                baixar QR
              </a>
            </Button>
          </section>
        </div>
      ) : null}
    </div>
  );
}

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

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleLogout() {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        setError("Não foi possível sair agora.");
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
        variant="outline"
        className="h-9"
        disabled={isPending}
        onClick={handleLogout}
      >
        {isPending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <LogOut aria-hidden="true" />
        )}
        sair
      </Button>
      {error ? (
        <p className="text-sm leading-6 text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
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
