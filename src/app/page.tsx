import { AamemLogo } from "@/components/brand/aamem-logo";

export default function Home() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-8 py-16">
      <AamemLogo priority className="h-auto w-full max-w-[420px]" />
    </main>
  );
}
