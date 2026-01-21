/**
 * Composant de chargement pour la page Groupes & Familles
 * Affiché automatiquement par Next.js pendant le chargement de la page
 */

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      {/* Spinner animé */}
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      
      {/* Message de chargement */}
      <p className="text-muted-foreground text-sm">Chargement des groupes...</p>
      
      {/* Skeleton pour prévisualiser la structure */}
      <div className="w-full max-w-4xl space-y-3 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
