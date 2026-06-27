"use client";

import { useState } from "react";
import { CheckCircle2, CircleAlert, HandHeart, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const PRAYER_DESCRIPTION =
  "E tudo quanto pedirdes em meu nome, isso farei, a fim de que o Pai seja glorificado no Filho. Se me pedirdes alguma coisa em meu nome, eu o farei João 14:13-14";

type PrayerRequestPageProps = {
  className?: string;
  status?: "idle" | "loading" | "success" | "error";
  contactStatus?: "idle" | "loading" | "success";
  contactError?: string;
  institutionName?: string;
  logoUrl?: string;
  onSubmit?: (message: string) => void;
  onContactSubmit?: (contact: { name: string; whatsapp: string }) => void;
  onSkipContact?: () => void;
};

const statusContent = {
  success: {
    icon: CheckCircle2,
    title: "Pedido enviado",
    description:
      "Recebemos seu pedido de oração. A igreja vai orar por você com carinho.",
    className: "border-brand-rose/30 bg-secondary text-brand-cocoa",
    iconClassName: "text-brand-rose",
  },
  error: {
    icon: CircleAlert,
    title: "Não foi possível enviar",
    description:
      "Tente novamente em alguns instantes ou procure outro canal de contato da igreja.",
    className: "border-destructive/30 bg-destructive/10 text-brand-cocoa",
    iconClassName: "text-destructive",
  },
};

export function PrayerRequestPage({
  className,
  status = "idle",
  contactStatus = "idle",
  contactError,
  institutionName = "Igreja da Graça",
  logoUrl,
  onSubmit,
  onContactSubmit,
  onSkipContact,
}: PrayerRequestPageProps) {
  const [message, setMessage] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const feedback =
    status === "success" || status === "error" ? statusContent[status] : null;
  const FeedbackIcon = feedback?.icon;

  if (isSuccess) {
    return (
      <main
        className={cn(
          "min-h-svh bg-background px-5 py-12 text-foreground",
          className
        )}
      >
        <section className="mx-auto flex min-h-[calc(100svh-6rem)] w-full max-w-xl flex-col justify-center gap-7">
          <header className="flex flex-col items-center gap-4 text-center">
            <div
              className="flex size-24 items-center justify-center overflow-hidden rounded-full border border-brand-rose/25 bg-secondary text-3xl text-brand-cocoa shadow-sm"
              role="img"
              aria-label={`Logo da instituição ${institutionName}`}
              style={
                logoUrl
                  ? {
                      backgroundImage: `url(${logoUrl})`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }
                  : undefined
              }
            >
              {logoUrl
                ? null
                : institutionName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((word) => word[0]?.toUpperCase())
                    .join("") || <HandHeart className="size-7" aria-hidden />}
            </div>
            <div className="space-y-2">
              <p className="text-xl leading-tight text-brand-cocoa">
                {institutionName}
              </p>
              <h1 className="text-3xl leading-tight text-brand-cocoa">
                Pedido de oração enviado.
              </h1>
              <p className="text-base leading-7 text-brand-lavender">
                Nós estaremos orando por você.
              </p>
            </div>
          </header>

          <section
            aria-label="Contato opcional"
            className="space-y-4 rounded-xl border border-brand-rose/30 bg-white/80 p-4 shadow-sm"
          >
            <div className="space-y-1">
              <h2 className="text-lg leading-tight text-brand-cocoa">
                Quer que a igreja entre em contato?
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Deixe seu nome e WhatsApp se quiser receber uma mensagem.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-brand-cocoa">
                Nome
                <Input
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  className="h-11 bg-background"
                  placeholder="seu nome"
                />
              </label>
              <label className="space-y-2 text-sm text-brand-cocoa">
                WhatsApp
                <Input
                  value={contactWhatsapp}
                  onChange={(event) => setContactWhatsapp(event.target.value)}
                  className="h-11 bg-background"
                  inputMode="tel"
                  placeholder="(00) 00000-0000"
                />
              </label>
            </div>

            {contactError ? (
              <p className="text-sm leading-6 text-destructive" role="alert">
                {contactError}
              </p>
            ) : null}

            {contactStatus === "success" ? (
              <p
                className="rounded-lg border border-brand-rose/30 bg-secondary px-3 py-2 text-sm leading-6 text-brand-cocoa"
                role="status"
              >
                Contato enviado. Vamos te levar de volta para a página da
                igreja.
              </p>
            ) : null}
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              className="h-12 text-base"
              disabled={contactStatus === "loading"}
              onClick={() =>
                onContactSubmit?.({
                  name: contactName,
                  whatsapp: contactWhatsapp,
                })
              }
            >
              {contactStatus === "loading" ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  enviando contato
                </>
              ) : (
                "quero contato"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 text-base"
              disabled={contactStatus === "loading"}
              onClick={onSkipContact}
            >
              não obrigado
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      className={cn(
        "min-h-svh bg-background px-5 pb-28 pt-14 text-foreground",
        className
      )}
    >
      <section className="mx-auto flex w-full max-w-xl flex-col gap-8">
        <header className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-accent">
              <HandHeart className="size-5" aria-hidden="true" />
            </span>
            <h1 className="text-3xl leading-tight text-brand-cocoa sm:text-4xl">
              .Pedido de oração
            </h1>
          </div>
          <p className="text-base leading-8 text-brand-lavender">
            {PRAYER_DESCRIPTION}
          </p>
        </header>

        <div className="space-y-4">
          {feedback && FeedbackIcon ? (
            <div
              className={cn(
                "flex gap-3 rounded-xl border px-4 py-3 text-sm leading-6",
                feedback.className
              )}
              role={status === "error" ? "alert" : "status"}
            >
              <FeedbackIcon
                className={cn("mt-0.5 size-5 shrink-0", feedback.iconClassName)}
                aria-hidden="true"
              />
              <div>
                <p className="font-medium">{feedback.title}</p>
                <p className="text-muted-foreground">{feedback.description}</p>
              </div>
            </div>
          ) : null}

          <label className="sr-only" htmlFor="prayer-request">
            Pedido de oração
          </label>
          <Textarea
            id="prayer-request"
            name="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="escreva aqui seu pedido"
            disabled={isLoading}
            aria-busy={isLoading}
            className="min-h-52 resize-none rounded-xl border-brand-rose/30 bg-white/80 px-4 py-4 text-base shadow-sm placeholder:text-brand-rose/70 focus-visible:border-brand-rose"
          />
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 px-5 py-4 shadow-[0_-12px_40px_rgb(43_29_29/0.08)] backdrop-blur">
        <div className="mx-auto w-full max-w-xl">
          <Button
            type="button"
            className="h-12 w-full text-base"
            disabled={isLoading}
            onClick={() => onSubmit?.(message)}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                enviando pedido
              </>
            ) : status === "error" ? (
              "tentar enviar novamente"
            ) : (
              "enviar pedido de oração"
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}
