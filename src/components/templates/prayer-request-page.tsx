import { CheckCircle2, CircleAlert, HandHeart, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const PRAYER_DESCRIPTION =
  "E tudo quanto pedirdes em meu nome, isso farei, a fim de que o Pai seja glorificado no Filho. Se me pedirdes alguma coisa em meu nome, eu o farei João 14:13-14";

type PrayerRequestPageProps = {
  className?: string;
  status?: "idle" | "loading" | "success" | "error";
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
}: PrayerRequestPageProps) {
  const isLoading = status === "loading";
  const feedback =
    status === "success" || status === "error" ? statusContent[status] : null;
  const FeedbackIcon = feedback?.icon;

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
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                enviando pedido
              </>
            ) : status === "success" ? (
              "pedido enviado"
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
