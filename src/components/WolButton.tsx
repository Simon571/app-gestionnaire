import { Button, buttonVariants } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export function WolButton({ href }: { href?: string | null }) {
  const url = href && href.trim().length > 0 ? href : null;

  if (!url) {
    return (
      <Button variant="secondary" size="sm" disabled>
        <BookOpen className="h-4 w-4 mr-2" />
        <span>wol.jw.org</span>
      </Button>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={buttonVariants({ variant: "secondary", size: "sm" })}
    >
      <BookOpen className="h-4 w-4 mr-2" />
      <span>wol.jw.org</span>
    </a>
  );
}