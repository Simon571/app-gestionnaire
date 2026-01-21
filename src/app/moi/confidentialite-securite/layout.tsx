import { ReactNode } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  children: ReactNode;
};

export default async function ConfidentialiteSecuriteLayout({ children }: Props) {
  return <>{children}</>;
}
