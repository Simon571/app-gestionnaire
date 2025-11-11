import dynamic from 'next/dynamic';

const PrivacySecurityPage = dynamic(
  () => import('./privacy-security-content'),
  { 
    ssr: false,
    loading: () => <div>Chargement...</div>
  }
);

export default function Page() {
  return <PrivacySecurityPage />;
}
