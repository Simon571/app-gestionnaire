"use client";
import React, { useTransition } from "react";
import { Loader2 } from "lucide-react";

export function TabsPending({ tabs }:{ tabs:{key:string; label:string; panel:React.ReactNode;}[] }){
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = React.useState(tabs[0].key);
  const current = tabs.find(t => t.key === active)!;
  return (
    <div>
      <div className="flex gap-2 border-b">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => startTransition(() => setActive(t.key))}
            className={[
              "rounded-t-lg px-3 py-2 text-sm font-medium",
              active === t.key ? "border-b-2 border-yellow-500 text-yellow-600"
                               : "text-slate-600 hover:text-slate-800",
            ].join(" ")}
            aria-current={active === t.key ? "page" : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="relative mt-4 min-h-[120px]">
        {isPending && (
          <div className="absolute inset-0 grid place-items-center bg-white/50 backdrop-blur-sm">
            <Loader2 className="animate-spin text-yellow-500" size={24} strokeWidth={2.6}/>
          </div>
        )}
        <div aria-busy={isPending} className={isPending ? "opacity-50 transition-opacity" : ""}>{current.panel}</div>
      </div>
    </div>
  );
}
