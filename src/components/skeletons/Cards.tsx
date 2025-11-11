export function CardsSkeleton(){
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({length:4}).map((_,i)=>(        <div key={i} className="h-28 rounded-2xl border bg-white overflow-hidden">
          <div className="h-full animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />
        </div>
      ))}
    </div>
  );
}
