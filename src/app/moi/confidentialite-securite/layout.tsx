import { ReactNode } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type LayoutProps = {
	children: ReactNode;
	params: Promise<Record<string, string>>;
};

export default async function ConfidentialiteSecuriteLayout({ children }: LayoutProps) {
	return <>{children}</>;
}
