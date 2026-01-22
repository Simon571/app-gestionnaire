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
