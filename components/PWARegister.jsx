"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] Service Worker FacturX enregistré avec succès (Scope:", registration.scope, ")");
          })
          .catch((error) => {
            console.warn("[PWA] Échec enregistrement Service Worker:", error);
          });
      });
    }
  }, []);

  return null;
}
