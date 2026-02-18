import { DownloadButton } from "@/components/marketing/download-button";

const COPY: Record<string, any> = {
  fr: {
    badge: "Applications officielles",
    title: "Gestionnaire d'Assemblée",
    description:
      "L'outil complet pour organiser les réunions, la prédication, les territoires et la communication de votre assemblée. Disponible sur Windows (PC administrateur) et Android (proclamateurs).",
    what_you_get: "Ce que vous obtenez",
    quick_install: "Installation rapide",
    security: "Sécurité & conformité",
    windows_title: "Windows — Administrateur",
    windows_desc: "Pour l'ancien de l'assemblée. Gère les personnes, groupes, rapports et synchronise vers le serveur.",
    android_title: "Android — Proclamateur",
    android_desc: "Pour chaque proclamateur. Entre ses identifiants d'assemblée, envoie ses rapports mensuels, consulte son planning.",
    android_steps: [
      "Téléchargez et installez l'APK sur votre Android.",
      "Ouvrez l'app et entrez l'ID de votre assemblée + le PIN.",
      "Connectez-vous avec votre prénom et votre code personnel.",
      "Vos données se synchronisent automatiquement.",
    ],
    android_note: "⚠️ Activer 'Sources inconnues' dans les paramètres Android avant l'installation.",
    steps: [
      "Téléchargez le fichier .msi depuis ce bouton.",
      "Double-cliquez pour installer l'application.",
      "Lancez Gestionnaire d'Assemblée depuis le menu Démarrer.",
      "Entrez l'ID et le PIN de votre assemblée dans les paramètres.",
    ],
    note: "Besoin d'aide ? Suivez les étapes ci-dessous pour installer et démarrer.",
    footerLine1: "Dernière version publiée sur GitHub.",
    footerLine2: "Fichiers .msi inclus.",
  },
  en: {
    badge: "Official apps",
    title: "Assembly Manager",
    description:
      "All-in-one tool to organise meetings, preaching, territories and communication for your congregation. Available on Windows (admin) and Android (publishers).",
    what_you_get: "What you get",
    quick_install: "Quick install",
    security: "Security & compliance",
    windows_title: "Windows — Administrator",
    windows_desc: "For the congregation elder. Manages people, groups, reports and syncs to the server.",
    android_title: "Android — Publisher",
    android_desc: "For each publisher. Enter your congregation credentials, submit monthly reports, view your schedule.",
    android_steps: [
      "Download and install the APK on your Android device.",
      "Open the app and enter your congregation ID + PIN.",
      "Log in with your first name and personal code.",
      "Your data syncs automatically.",
    ],
    android_note: "⚠️ Enable 'Unknown sources' in Android settings before installing.",
    steps: [
      "Download the .msi file from this button.",
      "Double-click the installer.",
      "Open Assembly Manager from the Start menu.",
      "Enter your congregation ID and PIN in settings.",
    ],
    note: "Need help? Follow the steps below to install and start.",
    footerLine1: "Latest release available on GitHub.",
    footerLine2: "Includes .msi installer.",
  },
};

export function DownloadPortal({ locale = "fr" }: { locale?: string }) {
  const lang = locale.startsWith("en") ? "en" : "fr";
  const t = COPY[lang];
  const downloadUrl = "/api/download/windows";
  const androidUrl = "/api/download/android";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: lang === "fr" ? "Gestionnaire d'Assemblée" : "Assembly Manager",
    description: t.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Windows, Android",
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

          {/* Windows card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold">🖥 {t.windows_title}</h2>
            <p className="mb-4 text-sm text-muted-foreground">{t.windows_desc}</p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <DownloadButton locale={lang} />
              <div className="text-sm text-muted-foreground">
                <p>{t.footerLine1}</p>
                <p>{t.footerLine2}</p>
              </div>
            </div>
          </div>

          {/* Android card */}
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold">📱 {t.android_title}</h2>
            <p className="mb-4 text-sm text-muted-foreground">{t.android_desc}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={androidUrl}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-colors"
              >
                ⬇ Télécharger l'APK Android
              </a>
            </div>
            <p className="mt-3 text-xs text-amber-700">{t.android_note}</p>
            <p className="mt-1 text-xs text-muted-foreground">🚀 Bientôt disponible sur Google Play</p>
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
                    <a className="rounded-md border px-3 py-2 text-xs" href="mailto:mainteneur@example.org?subject=Problème%20-%20Installation%20Gestionnaire%20d'Assembl%C3%A9e&body=Bonjour%2C%0A%0AJ'ai%20rencontr%C3%A9%20un%20probl%C3%A8me%20avec%20la%20version%20v1.0.1.%20Merci%20de%20pr%C3%A9ciser%20%3A%0A-%20Windows%20version%20%3A%20%0A-%20Nom%20du%20fichier%20t%C3%A9l%C3%A9charg%C3%A9%20%3A%0A-%20SHA256%20(obligatoire%20si%20possible)%20%3A%0A-%20Capture%20d'%C3%A9cran%20%3A%0A%0ADescription%20du%20probl%C3%A8me%20%3A%0A" title="Contacter le support">Signaler un problème</a>
                    <a className="rounded-md border px-3 py-2 text-xs" href="https://github.com/Simon571/app-gestionnaire/issues/new?template=tester-report.md&title=Retour%20test%20v1.0.1" target="_blank" rel="noreferrer">Ouvrir un rapport de test</a>
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
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-base font-semibold">🖥 {t.windows_title}</h3>
            <ol className="grid gap-3 text-sm text-muted-foreground">
              {t.steps.map((s: string, i: number) => (
                <li key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  {i + 1}. {s}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3 className="mb-3 text-base font-semibold">📱 {t.android_title}</h3>
            <ol className="grid gap-3 text-sm text-muted-foreground">
              {t.android_steps.map((s: string, i: number) => (
                <li key={i} className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  {i + 1}. {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">{t.security}</h2>
        <p className="mt-3 text-sm text-muted-foreground">Les données restent locales et les mises à jour sont signées. Pensez à garder Windows à jour et à conserver vos sauvegardes.</p>
      </section>
    </main>
  );
}
