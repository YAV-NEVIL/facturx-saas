import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import PWARegister from "@/components/PWARegister";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "FacturX — SaaS de Facturation & Recouvrement B2B (FCFA / RDC)",
  description: "Solution moderne de facturation, devis et suivi des paiements en FCFA avec TVA 18% / 16% - Mode Hors-Ligne & PWA",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#1A44B8",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1A44B8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FacturX" />
      </head>
      <body className="antialiased min-h-screen bg-[#F6F8FC] text-slate-800">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
