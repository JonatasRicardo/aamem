import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type AamemLogoProps = Omit<ImageProps, "src" | "alt" | "width" | "height"> & {
  alt?: string;
};

export function AamemLogo({
  alt = "aamém",
  className,
  sizes = "(min-width: 768px) 420px, 70vw",
  ...props
}: AamemLogoProps) {
  return (
    <Image
      src="/brand/aamem-logo.png"
      alt={alt}
      width={522}
      height={224}
      sizes={sizes}
      className={cn("block h-auto w-auto", className)}
      {...props}
    />
  );
}
