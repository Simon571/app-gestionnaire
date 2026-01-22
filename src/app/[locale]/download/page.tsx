import type { Metadata } from "next";
import { DownloadPortal } from "@/components/marketing/download-portal";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://app-gestionnaire.vercel.app";

export function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }];
}

const COPY: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Télécharger l'application Windows",
    description:
      "Téléchargez l'application Gestionnaire d'Assemblée pour Windows. Installation rapide via GitHub Releases.",
  },
  en: {
    title: "Download the Windows app",
    description: "Download Assembly Manager for Windows — fast local install via GitHub Releases.",
  },
};

export async function generateMetadata(props: any): Promise<Metadata> {
  const locale = props?.params?.locale ?? (typeof props === "string" ? props : undefined);
  const lang = String(locale || "fr").startsWith("en") ? "en" : "fr";
  const c = COPY[lang];
  const url = `${siteUrl}/${lang}/download`;

  return {
    title: c.title,
    description: c.description,
    alternates: {
      canonical: url,
      languages: {
        "en-US": `${siteUrl}/en/download`,
        "fr-FR": `${siteUrl}/fr/download`,
      },
    },
    openGraph: {
      title: c.title,
      description: c.description,
      url,
      locale: lang === "fr" ? "fr_FR" : "en_US",
    },
  };
}

export default function DownloadPage(props: any) {
  const locale = props?.params?.locale ?? "fr";
  return <DownloadPortal locale={locale} />;
}
