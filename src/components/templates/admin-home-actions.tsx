"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  Check,
  Copy,
  Download,
  Loader2,
  Printer,
  QrCode,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

export function AdminPrayerQrCode({
  institutionName,
  prayerRequestPath,
}: {
  institutionName: string;
  prayerRequestPath: string;
}) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "success">("idle");
  const [isGenerating, setIsGenerating] = useState(false);

  function getPublicUrl() {
    return new URL(prayerRequestPath, window.location.origin).toString();
  }

  async function handleCopyLink() {
    setError("");

    try {
      const nextPublicUrl = getPublicUrl();

      await navigator.clipboard.writeText(nextPublicUrl);
      setPublicUrl(nextPublicUrl);
      setCopyStatus("success");
      window.setTimeout(() => setCopyStatus("idle"), 2200);
    } catch {
      setError("Não foi possível copiar o link agora.");
    }
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
    } catch {
      setError("Não foi possível gerar o QR Code agora.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Card>
      <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-brand-indigo">
              <QrCode className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <CardTitle>QR Code Pedido de Oração</CardTitle>
              <CardDescription>{institutionName}</CardDescription>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm leading-6 text-muted-foreground">
              Link público:{" "}
              <span className="break-all text-brand-cocoa">
                {publicUrl || prayerRequestPath}
              </span>
            </p>
            {error ? (
              <p className="text-sm leading-6 text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={handleCopyLink}
              >
                {copyStatus === "success" ? (
                  <Check aria-hidden="true" />
                ) : (
                  <Copy aria-hidden="true" />
                )}
                {copyStatus === "success" ? "link copiado" : "copiar link"}
              </Button>
              <Button
                type="button"
                className="h-9"
                disabled={isGenerating}
                onClick={handleGenerateQrCode}
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <QrCode aria-hidden="true" />
                )}
                gerar QR Code
              </Button>
              {qrCodeUrl ? (
                <Button asChild type="button" variant="outline" className="h-9">
                  <a
                    href={qrCodeUrl}
                    download={`qr-code-pedido-de-oracao-${institutionName
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "")}.png`}
                  >
                    <Download aria-hidden="true" />
                    baixar
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {qrCodeUrl ? (
          <div className="flex w-full justify-center lg:w-auto lg:justify-end">
            <Image
              src={qrCodeUrl}
              alt={`QR Code do pedido de oração de ${institutionName}`}
              width={192}
              height={192}
              unoptimized
              className="size-48 rounded-lg border border-border bg-white p-3 shadow-sm"
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
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
