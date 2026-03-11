"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

// Utilise la route API pour la redirection
const DEFAULT_RELEASES = "/api/download/windows";

const LABELS: Record<string, { download: string; detecting: string; reserved: string; releases: string; view_releases: string }> = {
  fr: {
    download: "Télécharger pour Windows",
    detecting: "Détection du système…",
    reserved: "Ce téléchargement est réservé à Windows.",
    releases: "Téléchargement direct via GitHub Releases.",
    view_releases: "Voir les releases disponibles",
  },
  en: {
    download: "Download for Windows",
    detecting: "Detecting OS…",
    reserved: "This download is for Windows only.",
    releases: "Direct download via GitHub Releases.",
    view_releases: "See available releases",
  },
};

export function DownloadButton({ locale }: { locale?: string }) {
  const [isWindows, setIsWindows] = React.useState<boolean | null>(null);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsWindows(/windows/i.test(navigator.userAgent));
    setIsHydrated(true);
  }, []);

  const lang = (locale || navigator.language || "fr").startsWith("en") ? "en" : "fr";
  const L = LABELS[lang];
  const releasesUrl = DEFAULT_RELEASES;

  const isReady = isHydrated && isWindows !== null;
  const isSupported = isWindows === true;

  return (
    <div className="flex flex-col gap-3" suppressHydrationWarning>
      <Button asChild disabled={!isHydrated || !isReady || !isSupported} className="h-12 px-6 text-base">
        <a
          href={releasesUrl}
          aria-label={L.download}
        >
          {isHydrated ? (isReady ? L.download : L.detecting) : L.detecting}
        </a>
      </Button>

      {!isHydrated || !isReady ? null : isSupported ? (
        <p className="text-sm text-muted-foreground">{L.releases}</p>
      ) : (
        <div className="text-sm text-muted-foreground">
          <p>{L.reserved}</p>
          <a
            className="underline underline-offset-4 hover:text-foreground"
            href={releasesUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {L.view_releases}
          </a>
        </div>
      )}
    </div>
  );
}
