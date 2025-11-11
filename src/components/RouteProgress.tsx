"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function RouteProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const timer = useRef<NodeJS.Timeout | null>(null);

  function start() {
    setProgress(10);
    timer.current && clearInterval(timer.current);
    timer.current = setInterval(() => {
      setProgress((p) => (p < 85 ? p + 5 : p)); // grimpe jusqu’à 85%
    }, 200);
  }
  function done() {
    timer.current && clearInterval(timer.current);
    setProgress(100);
    setTimeout(() => setProgress(0), 250); // reset discret
  }

  // déclenche quand l’URL change
  useEffect(() => {
    start();
    // La fonction de nettoyage n'est pas nécessaire ici car `done` est appelé dans le second useEffect
  }, [pathname]);

  // termine à l’hydratation du nouveau segment
  useEffect(() => {
    if (pathname) {
        done();
    }
  }, [pathname]); // Ce hook s'exécutera après le premier, terminant la barre de progression

  return (
    <div className="pointer-events-none fixed left-0 top-0 z-[999] h-0.5 w-full bg-transparent">
      <div
        style={{ width: `${progress}%` }}
        className="h-full bg-yellow-400 transition-[width] duration-200 ease-out shadow-[0_1px_6px_rgba(250,204,21,.6)]"
      />
    </div>
  );
}
