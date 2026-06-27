import { HandHeart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const PRAYER_DESCRIPTION =
  "E tudo quanto pedirdes em meu nome, isso farei, a fim de que o Pai seja glorificado no Filho. Se me pedirdes alguma coisa em meu nome, eu o farei João 14:13-14";

type PrayerRequestPageProps = {
  className?: string;
};

export function PrayerRequestPage({ className }: PrayerRequestPageProps) {
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

        <div className="space-y-3">
          <label className="sr-only" htmlFor="prayer-request">
            Pedido de oração
          </label>
          <Textarea
            id="prayer-request"
            placeholder="escreva aqui seu pedido"
            className="min-h-52 resize-none rounded-xl border-brand-rose/30 bg-white/80 px-4 py-4 text-base shadow-sm placeholder:text-brand-rose/70 focus-visible:border-brand-rose"
          />
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 px-5 py-4 shadow-[0_-12px_40px_rgb(43_29_29/0.08)] backdrop-blur">
        <div className="mx-auto w-full max-w-xl">
          <Button type="button" className="h-12 w-full text-base">
            enviar pedido de oração
          </Button>
        </div>
      </div>
    </main>
  );
}

