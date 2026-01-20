"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

const releasesUrl =
  process.env.NEXT_PUBLIC_RELEASES_URL ||
  "https://github.com/OWNER/REPO/releases/latest";

export function DownloadButton() {
  const [isWindows, setIsWindows] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setIsWindows(/windows/i.test(navigator.userAgent));
  }, []);

  const isReady = isWindows !== null;
  const isSupported = isWindows === true;

  return (
    <div className="flex flex-col gap-3">
      <Button asChild disabled={!isReady || !isSupported} className="h-12 px-6 text-base">
        <a href={releasesUrl} target="_blank" rel="noreferrer">
          {isReady ? "Télécharger l'application Windows" : "Détection du système..."}
        </a>
      </Button>
      {!isReady ? null : isSupported ? (
        <p className="text-sm text-muted-foreground">
          Téléchargement direct via GitHub Releases.
        </p>
      ) : (
        <div className="text-sm text-muted-foreground">
          <p>Ce téléchargement est réservé à Windows.</p>
          <a
            className="underline underline-offset-4 hover:text-foreground"
            href={releasesUrl}
            target="_blank"
            rel="noreferrer"
          >
            Voir les releases disponibles
          </a>
        </div>
      )}
    </div>
  );
}
