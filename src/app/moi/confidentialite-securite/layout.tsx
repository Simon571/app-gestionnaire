import { ReactNode } from 'react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Confidentialité & Sécurité',
};

interface LayoutProps {
  children: ReactNode;
}

export default function ConfidentialiteSecuriteLayout({ children }: LayoutProps) {
	return <>{children}</>;
}
