/**
 * Composant de chargement pour la page Activité de Prédication
 * Affiché automatiquement par Next.js pendant le chargement de la page
 */

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      {/* Spinner animé */}
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      
      {/* Message de chargement */}
      <p className="text-muted-foreground text-sm">Chargement des rapports de prédication...</p>
      
      {/* Skeleton pour prévisualiser la structure */}
      <div className="w-full max-w-4xl space-y-3 px-4">
        <div className="h-10 w-48 bg-muted animate-pulse rounded"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
      </div>
    </div>
  );
}
