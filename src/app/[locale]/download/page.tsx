import type { Metadata } from "next";
import { DownloadPortal } from "@/components/marketing/download-portal";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://app-gestionnaire.vercel.app";

export const metadata: Metadata = {
  title: "Télécharger l'application Windows",
  description:
    "Téléchargez l'application Gestionnaire d'Assemblée pour Windows. Installation rapide via GitHub Releases.",
  openGraph: {
    title: "Télécharger l'application Windows",
    description:
      "Téléchargez l'application Gestionnaire d'Assemblée pour Windows. Installation rapide via GitHub Releases.",
    url: `${siteUrl}/download`,
  },
};

export default function DownloadPage() {
  return <DownloadPortal />;
}
