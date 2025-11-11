"use client";

import { BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function WolButton({ href }: { href?: string }) {
  const url = href ?? "https://wol.jw.org/fr/wol/h/r30/lp-f";
  const disabled = !href;

  return (
    <a
      href={disabled ? "#" : url}
      target="_blank"
      rel="noreferrer"
      className={
        buttonVariants({ variant: "secondary", size: "sm" }) +
        " inline-flex items-center" +
        (disabled ? " pointer-events-none opacity-60" : "")
      }
    >
      <BookOpen className="h-4 w-4 mr-2" />
      wol.jw.org
    </a>
  );
}