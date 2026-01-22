import { DownloadButton } from "@/components/marketing/download-button";

const COPY: Record<string, any> = {
  fr: {
    badge: "Application desktop officielle",
    title: "Gestionnaire d'Assemblée",
    description:
      "L'outil complet pour organiser les réunions, la prédication, les territoires et la communication de votre assemblée. Téléchargez la version Windows pour une expérience locale rapide et fiable.",
    what_you_get: "Ce que vous obtenez",
    quick_install: "Installation rapide",
    security: "Sécurité & conformité",
    steps: [
      "Téléchargez le fichier .msi ou .exe depuis GitHub Releases.",
      "Double-cliquez pour installer l'application.",
      "Lancez Gestionnaire d'Assemblée depuis le menu Démarrer.",
      "Importez vos données et commencez immédiatement.",
    ],
    note: "Besoin d'aide ? Suivez les étapes ci-dessous pour installer et démarrer.",
    footerLine1: "Dernière version publiée sur GitHub.",
    footerLine2: "Fichiers .msi et .exe inclus.",
  },
  en: {
    badge: "Official desktop app",
    title: "Assembly Manager",
    description:
      "All-in-one tool to organise meetings, preaching, territories and communication for your congregation. Download the Windows app for a fast, local, reliable experience.",
    what_you_get: "What you get",
    quick_install: "Quick install",
    security: "Security & compliance",
    steps: [
      "Download the .msi or .exe from GitHub Releases.",
      "Double-click the installer to install the app.",
      "Open Assembly Manager from the Start menu.",
      "Import your data and get started.",
    ],
    note: "Need help? Follow the steps below to install and start.",
    footerLine1: "Latest release available on GitHub.",
    footerLine2: "Includes .msi and .exe installers.",
  },
};

export function DownloadPortal({ locale = "fr" }: { locale?: string }) {
  const lang = locale.startsWith("en") ? "en" : "fr";
  const t = COPY[lang];
  const downloadUrl = process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL ||
    process.env.NEXT_PUBLIC_RELEASES_URL ||
    "https://github.com/OWNER/REPO/releases/latest";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: lang === "fr" ? "Gestionnaire d'Assemblée" : "Assembly Manager",
    description: t.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Windows",
    offers: {
      "@type": "Offer",
      url: downloadUrl,
    },
    url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://example.org"}/$${lang}/download`,
  } as const;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-12">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            {t.badge}
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t.title}</h1>
          <p className="text-lg text-muted-foreground">{t.description}</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <DownloadButton locale={lang} />
            <div className="text-sm text-muted-foreground">
              <p>{t.footerLine1}</p>
              <p>{t.footerLine2}</p>
            </div>
          </div>

          {/* Installer info for non-technical users (enhanced) */}
          <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm">
            <div className="flex gap-4 items-start">
              <div className="w-40 shrink-0">
                <img src="/download-demo.svg" alt="Aperçu : installation en 3 étapes" className="w-full rounded-md border" />
              </div>

              <div className="flex-1">
                <div className="mb-2">
                  <strong>Fichier :</strong> <a className="underline" href={downloadUrl} target="_blank" rel="noreferrer">Télécharger l'installateur</a>
                </div>

                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  {process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_SIZE && (
                    <div>📦 Taille : {process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_SIZE}</div>
                  )}
                  {process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_SHA256 && (
                    <div>🔒 SHA‑256 : <code className="break-all">{process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_SHA256}</code></div>
                  )}
                  <div>
                    {process.env.NEXT_PUBLIC_WINDOWS_SIGNED === 'true' ? (
                      <span className="text-green-700">✅ Installateur signé numériquement</span>
                    ) : (
                      <span className="text-amber-700">⚠️ Installateur non signé — Windows peut afficher un avertissement</span>
                    )}
                  </div>

                  <div className="text-right">
                    <a className="text-sm underline" href="/docs/INSTALL-WINDOWS-FOR-USERS.md" target="_blank" rel="noreferrer">Fiche d'installation (imprimable)</a>
                  </div>
                </div>

                <div className="mt-3 rounded-md bg-white p-3 text-xs">
                  <strong>Installation en 3 clics :</strong>
                  <ol className="mt-2 list-decimal list-inside text-muted-foreground">
                    <li>Télécharger le fichier `.msi` depuis ce bouton.</li>
                    <li>Double‑cliquer et suivre l'assistant d'installation.</li>
                    <li>Ouvrir le menu Démarrer → lancer "Gestionnaire d'Assemblée".</li>
                  </ol>

                  {process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_SHA256 && (
                    <div className="mt-3">Pour vérifier la somme (optionnel) : <code>Get-FileHash $HOME\Downloads\nom-fichier.msi -Algorithm SHA256</code></div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <a className="rounded-md bg-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-sm" href={downloadUrl} target="_blank" rel="noreferrer">Télécharger l'installateur</a>
                    <a className="rounded-md border px-3 py-2 text-xs" href="mailto:mainteneur@example.org?subject=Problème%20-%20Installation%20Gestionnaire%20d'Assembl%C3%A9e&body=Bonjour%2C%0A%0AJ'ai%20rencontr%C3%A9%20un%20probl%C3%A8me%20avec%20la%20version%20v0.1.0-rc1.%20Merci%20de%20pr%C3%A9ciser%20%3A%0A-%20Windows%20version%20%3A%20%0A-%20Nom%20du%20fichier%20t%C3%A9l%C3%A9charg%C3%A9%20%3A%0A-%20SHA256%20(obligatoire%20si%20possible)%20%3A%0A-%20Capture%20d'%C3%A9cran%20%3A%0A%0ADescription%20du%20probl%C3%A8me%20%3A%0A" title="Contacter le support">Signaler un problème</a>
                    <a className="rounded-md border px-3 py-2 text-xs" href="https://github.com/Simon571/app-gestionnaire/issues/new?template=tester-report.md&title=Retour%20test%20v0.1.0-rc1" target="_blank" rel="noreferrer">Ouvrir un rapport de test</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-6 shadow-sm">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{t.what_you_get}</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>✅ Interface identique au mode Tauri dev</li>
              <li>✅ Installation Windows en 2 clics</li>
              <li>✅ Données locales et rapides</li>
              <li>✅ Mises à jour simples via GitHub Releases</li>
            </ul>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-muted-foreground">{t.note}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">{t.quick_install}</h2>
        <ol className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
          {t.steps.map((s: string, i: number) => (
            <li key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              {i + 1}. {s}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">{t.security}</h2>
        <p className="mt-3 text-sm text-muted-foreground">Les données restent locales et les mises à jour sont signées. Pensez à garder Windows à jour et à conserver vos sauvegardes.</p>
      </section>
    </main>
  );
}
