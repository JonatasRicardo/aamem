import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  HandHeart,
  ImagePlus,
  Link as LinkIcon,
  Loader2,
  Palette,
  Pencil,
  Sparkles,
} from "lucide-react";

import { AamemLogo } from "@/components/brand/aamem-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type SlugStatus =
  | "idle"
  | "checking"
  | "available"
  | "unavailable"
  | "error";

export type SubmitStatus = "idle" | "loading" | "success" | "error";
export type HomeCreateCtaState = "idle" | "loading";
export type FirebasePopupState = "closed" | "open" | "returning";
export type MinisiteTheme = "rose" | "indigo";

export type HomeCreateTemplateProps = {
  className?: string;
  ctaState?: HomeCreateCtaState;
  slug?: string;
  slugStatus?: SlugStatus;
  firebasePopupState?: FirebasePopupState;
};

export type CreateInstitutionTemplateProps = {
  className?: string;
  institutionName?: string;
  personName?: string;
  email?: string;
  slug?: string;
  logoPreviewUrl?: string;
  description?: string;
  theme?: MinisiteTheme;
  submitStatus?: SubmitStatus;
};

export type InstitutionBioTemplateProps = {
  className?: string;
  institutionName?: string;
  slug?: string;
  logoUrl?: string;
  prayerRequestHref?: string;
  description?: string;
  theme?: MinisiteTheme;
};

const SLUG_STATUS_CONTENT: Record<
  SlugStatus,
  {
    icon: typeof CheckCircle2;
    text: string;
    className: string;
    role?: "status" | "alert";
  }
> = {
  idle: {
    icon: LinkIcon,
    text: "O link será gerado automaticamente.",
    className: "text-muted-foreground",
  },
  checking: {
    icon: Clock3,
    text: "Verificando disponibilidade do link.",
    className: "text-brand-lavender",
    role: "status",
  },
  available: {
    icon: CheckCircle2,
    text: "Link disponível para criar.",
    className: "text-brand-indigo",
    role: "status",
  },
  unavailable: {
    icon: CircleAlert,
    text: "Este link já está em uso.",
    className: "text-destructive",
    role: "alert",
  },
  error: {
    icon: CircleAlert,
    text: "Não foi possível verificar agora.",
    className: "text-destructive",
    role: "alert",
  },
};

const SUBMIT_STATUS_CONTENT: Partial<
  Record<SubmitStatus, { text: string; role: "status" | "alert" }>
> = {
  success: {
    text: "Conta criada. O minisite está pronto para publicar.",
    role: "status",
  },
  error: {
    text: "Não foi possível criar agora. Tente novamente em instantes.",
    role: "alert",
  },
};

const MINISITE_THEME_CONTENT: Record<
  MinisiteTheme,
  {
    label: string;
    shellClassName: string;
    textClassName: string;
    mutedClassName: string;
    buttonClassName: string;
    logoClassName: string;
    swatchClassName: string;
  }
> = {
  rose: {
    label: "claro rose",
    shellClassName: "bg-white",
    textClassName: "text-brand-cocoa",
    mutedClassName: "text-brand-lavender",
    buttonClassName: "bg-brand-indigo text-white",
    logoClassName: "border-brand-rose/25 bg-secondary text-brand-cocoa",
    swatchClassName: "bg-[#f3eeee]",
  },
  indigo: {
    label: "indigo",
    shellClassName: "bg-brand-indigo",
    textClassName: "text-white",
    mutedClassName: "text-white/78",
    buttonClassName: "bg-white text-brand-indigo",
    logoClassName: "border-white/25 bg-white/12 text-white",
    swatchClassName: "bg-brand-indigo",
  },
};

function LogoPreview({
  url,
  institutionName,
  size = "lg",
  className,
}: {
  url?: string;
  institutionName: string;
  size?: "md" | "lg";
  className?: string;
}) {
  const initials = institutionName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-rose/25 bg-secondary text-brand-cocoa shadow-sm",
        size === "lg" ? "size-24 text-3xl" : "size-16 text-xl",
        className
      )}
      role="img"
      aria-label={`Logo da instituição ${institutionName}`}
      style={
        url
          ? {
              backgroundImage: `url(${url})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }
          : undefined
      }
    >
      {url ? null : initials || <ImagePlus className="size-7" aria-hidden />}
    </div>
  );
}

function EditButton({ label }: { label: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="rounded-full bg-background/80 shadow-sm"
      aria-label={label}
    >
      <Pencil className="size-3.5" aria-hidden="true" />
    </Button>
  );
}

function MinisitePhoneMockup({
  institutionName,
  description,
  slug,
  logoPreviewUrl,
  theme,
}: {
  institutionName: string;
  description: string;
  slug: string;
  logoPreviewUrl?: string;
  theme: MinisiteTheme;
}) {
  const themeContent = MINISITE_THEME_CONTENT[theme];

  return (
    <section aria-label="Mockup do minisite" className="mx-auto w-full max-w-[330px]">
      <div className="rounded-[2rem] border border-brand-cocoa/15 bg-brand-cocoa p-2 shadow-2xl">
        <div
          className={cn(
            "min-h-[560px] rounded-[1.55rem] px-5 py-6",
            themeContent.shellClassName
          )}
        >
          <div className="mx-auto mb-8 h-1.5 w-16 rounded-full bg-current opacity-15" />
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <LogoPreview
                url={logoPreviewUrl}
                institutionName={institutionName}
                className={themeContent.logoClassName}
              />
              <div className="absolute -right-1 -top-1">
                <EditButton label="Editar logo da instituição" />
              </div>
            </div>

            <div className="relative max-w-full px-8">
              <h2
                className={cn(
                  "break-words text-2xl leading-tight",
                  themeContent.textClassName
                )}
              >
                {institutionName}
              </h2>
              <div className="absolute -right-1 top-0">
                <EditButton label="Editar nome da instituição" />
              </div>
            </div>

            <div className="relative w-full px-7">
              <p
                className={cn(
                  "break-words text-sm leading-6",
                  themeContent.mutedClassName
                )}
              >
                {description}
              </p>
              <div className="absolute -right-1 top-0">
                <EditButton label="Editar descrição do minisite" />
              </div>
            </div>

            <p className={cn("font-mono text-xs", themeContent.mutedClassName)}>
              aamem.com/{slug}
            </p>
          </div>

          <div className="mt-10">
            <Button
              type="button"
              className={cn("h-13 w-full text-base", themeContent.buttonClassName)}
            >
              <HandHeart aria-hidden="true" />
              Pedido de oração
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SlugFeedback({ status }: { status: SlugStatus }) {
  const feedback = SLUG_STATUS_CONTENT[status];
  const FeedbackIcon = feedback.icon;

  return (
    <p
      className={cn("flex items-center gap-2 text-sm", feedback.className)}
      role={feedback.role}
      aria-live={status === "checking" ? "polite" : undefined}
    >
      <FeedbackIcon
        className={cn("size-4 shrink-0", status === "checking" && "animate-pulse")}
        aria-hidden="true"
      />
      {feedback.text}
    </p>
  );
}

export function HomeCreateTemplate({
  className,
  ctaState = "idle",
  slug = "igreja-da-graca",
  slugStatus = "available",
  firebasePopupState = "closed",
}: HomeCreateTemplateProps) {
  const isLoading = ctaState === "loading";
  const hasFirebasePopup = firebasePopupState !== "closed";
  const isReturning = firebasePopupState === "returning";
  const canCreate = slugStatus === "available" && !isLoading && !hasFirebasePopup;

  return (
    <main
      className={cn(
        "flex min-h-svh flex-col items-center justify-center bg-background px-6 py-12 text-foreground",
        className
      )}
    >
      <section className="flex w-full max-w-[420px] flex-col items-center gap-8">
        <AamemLogo priority className="h-auto w-full max-w-[330px]" />
        <div className="w-full space-y-5 text-center">
          <p className="mx-auto max-w-sm text-base leading-7 text-brand-lavender">
            Crie uma página simples para sua instituição receber pedidos de
            oração.
          </p>
          <div className="space-y-3 text-left">
            <Label htmlFor="home-slug">Escolha seu link</Label>
            <div className="flex overflow-hidden rounded-lg border border-input bg-white/80 text-left focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <span className="flex h-12 shrink-0 items-center border-r border-border px-3 font-mono text-sm text-muted-foreground">
                aamem.com/
              </span>
              <input
                id="home-slug"
                name="slug"
                value={slug}
                readOnly
                required
                className="h-12 min-w-0 flex-1 bg-transparent px-3 font-mono text-base outline-none"
                aria-describedby="home-slug-feedback"
              />
            </div>
            <div id="home-slug-feedback">
              <SlugFeedback status={slugStatus} />
            </div>
          </div>
          <Button className="h-11 w-full rounded-lg px-4" disabled={!canCreate}>
            {isLoading || isReturning ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                {isReturning ? "voltando para o site" : "abrindo"}
              </>
            ) : hasFirebasePopup ? (
              "login aberto"
            ) : (
              <>
                criar conta
                <ArrowRight aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </section>

      {hasFirebasePopup ? (
        <div className="fixed inset-0 flex items-center justify-center bg-brand-cocoa/35 px-5 backdrop-blur-sm">
          <section
            aria-label="Popup do Firebase"
            className="w-full max-w-sm rounded-lg border border-border bg-background p-5 text-left shadow-2xl"
            role="dialog"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-mono text-xs text-muted-foreground">
                  Firebase Authentication
                </p>
                <h2 className="text-xl leading-tight text-brand-cocoa">
                  {isReturning ? "Login confirmado" : "Entrar com Google"}
                </h2>
              </div>
              <Badge variant="secondary" className="h-6 rounded-lg">
                popup
              </Badge>
            </div>

            {isReturning ? (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-brand-lavender">
                  O Firebase autenticou a pessoa e está devolvendo para
                  continuar em aamem.com/{slug}.
                </p>
                <div
                  className="flex items-center gap-2 rounded-lg border border-brand-rose/30 bg-secondary px-3 py-2 text-sm text-brand-cocoa"
                  role="status"
                >
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  voltando para o site
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-brand-lavender">
                  Ao clicar em criar conta, o Firebase abre este popup para
                  autenticar com Google e depois retorna ao site.
                </p>
                <Button className="h-11 w-full" type="button">
                  <Sparkles aria-hidden="true" />
                  continuar com Google
                </Button>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}

export function CreateInstitutionTemplate({
  className,
  institutionName = "Igreja da Graça",
  personName = "Ana Souza",
  email = "ana@igreja.com",
  slug = "igreja-da-graca",
  logoPreviewUrl,
  description = "Um espaço simples para receber pedidos de oração e caminhar junto em fé.",
  theme = "rose",
  submitStatus = "idle",
}: CreateInstitutionTemplateProps) {
  const isLoading = submitStatus === "loading";
  const submitFeedback = SUBMIT_STATUS_CONTENT[submitStatus];

  return (
    <main
      className={cn(
        "min-h-svh bg-background px-5 pb-28 pt-7 text-foreground",
        className
      )}
    >
      <section className="mx-auto flex w-full max-w-md flex-col gap-6">
        <header className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <AamemLogo priority className="h-auto w-28" />
            <Badge variant="secondary" className="h-6 rounded-lg px-2">
              autenticado
            </Badge>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl leading-tight text-brand-cocoa">
              Monte o minisite
            </h1>
            <p className="text-base leading-7 text-brand-lavender">
              O login e o link já estão prontos. Agora ajuste o que aparece no
              celular.
            </p>
          </div>
        </header>

        <section aria-label="Temas do minisite" className="space-y-3">
          <div className="flex items-center gap-2 text-brand-cocoa">
            <Palette className="size-4" aria-hidden="true" />
            <h2 className="text-base leading-tight">Tema do minisite</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(MINISITE_THEME_CONTENT) as MinisiteTheme[]).map(
              (themeOption) => {
                const themeContent = MINISITE_THEME_CONTENT[themeOption];
                const isSelected = themeOption === theme;

                return (
                  <Button
                    key={themeOption}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className="h-11 justify-start"
                    aria-pressed={isSelected}
                  >
                    <span
                      className={cn(
                        "size-4 rounded-full border border-border",
                        themeContent.swatchClassName
                      )}
                      aria-hidden="true"
                    />
                    {themeContent.label}
                  </Button>
                );
              }
            )}
          </div>
        </section>

        <section
          aria-label="Dados confirmados"
          className="rounded-lg border border-border bg-white/70 p-3"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm text-brand-cocoa">Dados confirmados</h2>
            <Badge variant="outline" className="h-6 rounded-lg">
              Firebase
            </Badge>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Pessoa</dt>
              <dd className="truncate text-right text-brand-cocoa">{personName}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="truncate text-right text-brand-cocoa">{email}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Link</dt>
              <dd className="truncate text-right font-mono text-xs text-brand-cocoa">
                aamem.com/{slug}
              </dd>
            </div>
          </dl>
        </section>

        <MinisitePhoneMockup
          institutionName={institutionName}
          description={description}
          slug={slug}
          logoPreviewUrl={logoPreviewUrl}
          theme={theme}
        />
      </section>

      {submitFeedback ? (
        <div className="fixed inset-x-0 bottom-20 px-5">
          <div
            className={cn(
              "mx-auto max-w-md rounded-lg border bg-background px-4 py-3 text-sm shadow-lg",
              submitStatus === "error"
                ? "border-destructive/30 text-destructive"
                : "border-brand-rose/30 text-brand-cocoa"
            )}
            role={submitFeedback.role}
          >
            {submitFeedback.text}
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 px-5 py-4 shadow-[0_-12px_40px_rgb(43_29_29/0.08)] backdrop-blur">
        <div className="mx-auto max-w-md">
          <Button type="button" className="h-12 w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                criando minisite
              </>
            ) : (
              <>
                criar conta e minisite
                <ArrowRight aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}

export function InstitutionBioTemplate({
  className,
  institutionName = "Igreja da Graça",
  slug = "igreja-da-graca",
  logoUrl,
  prayerRequestHref = "/igreja-da-graca/pedido-de-oracao",
  description = "Um espaço simples para receber pedidos de oração e caminhar junto em fé.",
  theme = "rose",
}: InstitutionBioTemplateProps) {
  const themeContent = MINISITE_THEME_CONTENT[theme];

  return (
    <main
      className={cn(
        "min-h-svh bg-background px-5 py-10 text-foreground",
        className
      )}
    >
      <section className="mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-md flex-col justify-between gap-10">
        <div className="space-y-8">
          <header className="flex flex-col items-center gap-4 text-center">
            <LogoPreview
              url={logoUrl}
              institutionName={institutionName}
              size="lg"
              className={themeContent.logoClassName}
            />
            <div className="space-y-2">
              <h1 className="text-3xl leading-tight text-brand-cocoa">
                {institutionName}
              </h1>
              <p className="text-sm leading-6 text-brand-lavender">
                {description}
              </p>
              <p className="font-mono text-sm text-muted-foreground">
                aamem.com/{slug}
              </p>
            </div>
          </header>

          <Button asChild className="h-14 w-full text-base">
            <a href={prayerRequestHref}>
              <HandHeart aria-hidden="true" />
              Pedido de oração
            </a>
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          feito com aamém
        </p>
      </section>
    </main>
  );
}
