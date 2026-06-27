"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Home, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getRandomNotFoundVerseIndex,
  normalizeNotFoundVerseIndex,
  notFoundVerses,
} from "@/components/templates/not-found-verses";
import { cn } from "@/lib/utils";

type NotFoundPageProps = {
  className?: string;
  initialVerseIndex?: number;
  randomizeOnMount?: boolean;
};

export function NotFoundPage({
  className,
  initialVerseIndex,
  randomizeOnMount = initialVerseIndex === undefined,
}: NotFoundPageProps) {
  const [verseIndex, setVerseIndex] = useState(() =>
    normalizeNotFoundVerseIndex(initialVerseIndex ?? 0)
  );
  const verse = useMemo(() => notFoundVerses[verseIndex], [verseIndex]);

  useEffect(() => {
    if (!randomizeOnMount) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setVerseIndex((currentIndex) =>
        getRandomNotFoundVerseIndex(currentIndex)
      );
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [randomizeOnMount]);

  return (
    <main
      className={cn(
        "min-h-svh bg-background px-5 py-8 text-foreground sm:py-10",
        className
      )}
    >
      <section className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-3xl flex-col justify-center text-center items-center gap-8">
        <div className="space-y-6 text-center">
          <div className="space-y-5 text-center flex flex-col items-center justify-center">
            <Image
              src="/brand/aamem-logo.png"
              alt="aamém"
              width={522}
              height={224}
              priority
              className="h-auto w-28 sm:w-32"
            />

            <div className="space-y-4">
              <h1 className="max-w-2xl text-5xl leading-[1.05] text-brand-cocoa sm:text-6xl lg:text-7xl mb-6">
                <span
                  className=" text-brand-rose/30"
                  aria-label="erro 404"
                >
                  404
                </span> página arrebatada :)
              </h1>
            </div>
          </div>

          <div
            aria-label="Versículo 40:4"
            className="rounded-lg border border-brand-rose/25 bg-white p-5 shadow-[0_24px_70px_rgb(43_29_29/0.10)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl leading-tight text-brand-cocoa">
                  {verse.reference}
                </h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Sortear outro versículo"
                onClick={() =>
                  setVerseIndex(getRandomNotFoundVerseIndex(verseIndex))
                }
              >
                <RefreshCw className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <p className="mt-6 text-base leading-8 text-brand-lavender text-left">
              {verse.text}
            </p>
          </div>
        </div>

        <Button asChild className="h-12 w-fit px-5 text-base">
          <Link href="/">
            <Home className="size-4" aria-hidden="true" />
            voltar ao início
          </Link>
        </Button>
      </section>
    </main>
  );
}
