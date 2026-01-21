'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-lg text-muted-foreground">Page non trouvée</p>
      <Link href="/">
        <Button>
          <Home className="mr-2 h-4 w-4" />
          Retour à l&apos;accueil
        </Button>
      </Link>
    </div>
  );
}
