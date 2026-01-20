import { DownloadButton } from "@/components/marketing/download-button";

export function DownloadPortal() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-12">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            Application desktop officielle
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Gestionnaire d&apos;Assemblée
          </h1>
          <p className="text-lg text-muted-foreground">
            L&apos;outil complet pour organiser les réunions, la prédication, les territoires
            et la communication de votre assemblée. Téléchargez la version Windows
            pour une expérience locale rapide et fiable.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <DownloadButton />
            <div className="text-sm text-muted-foreground">
              <p>Dernière version publiée sur GitHub.</p>
              <p>Fichiers .msi et .exe inclus.</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-6 shadow-sm">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Ce que vous obtenez</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>✅ Interface identique au mode Tauri dev</li>
              <li>✅ Installation Windows en 2 clics</li>
              <li>✅ Données locales et rapides</li>
              <li>✅ Mises à jour simples via GitHub Releases</li>
            </ul>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-muted-foreground">
              Besoin d&apos;aide ? Suivez les étapes ci-dessous pour installer et démarrer.
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">Installation rapide</h2>
        <ol className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
          <li className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            1. Téléchargez le fichier .msi ou .exe depuis GitHub Releases.
          </li>
          <li className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            2. Double-cliquez pour installer l&apos;application.
          </li>
          <li className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            3. Lancez Gestionnaire d&apos;Assemblée depuis le menu Démarrer.
          </li>
          <li className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            4. Importez vos données et commencez immédiatement.
          </li>
        </ol>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">Sécurité & conformité</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Les données restent locales et les mises à jour sont signées.
          Pensez à garder Windows à jour et à conserver vos sauvegardes.
        </p>
      </section>
    </main>
  );
}
