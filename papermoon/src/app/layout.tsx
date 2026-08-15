import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AppProviders } from "./providers";

export const metadata: Metadata = {
  title: "PaperMoon — Simulador de trading de cripto",
  description:
    "Practica trading de criptomonedas con datos de mercado reales en vivo y una cartera 100% virtual. Sin dinero real, sin riesgo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
