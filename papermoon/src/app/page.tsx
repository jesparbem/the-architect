import Link from "next/link";
import { Moon, TrendingUp, Wallet, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: TrendingUp, title: "Datos reales en vivo", body: "Precios y velas en tiempo real desde Binance. El mercado de verdad, sin arriesgar nada." },
  { icon: Wallet, title: "Cartera virtual de $100.000", body: "Empieza con fondos ficticios. Compra, vende y sigue tu PnL como en un exchange real." },
  { icon: Zap, title: "Terminal profesional", body: "Gráfico de velas, ticket de órdenes, posiciones y equity — todo actualizándose al segundo." },
  { icon: ShieldCheck, title: "Cero riesgo, cero fricción", body: "Sin dinero real, sin custodia, sin KYC. Solo práctica pura para afinar tu estrategia." },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Moon className="h-5 w-5 text-primary" fill="currentColor" />
          Paper<span className="text-primary">Moon</span>
        </div>
        <Link href="/dashboard">
          <Button size="sm">Entrar</Button>
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-20 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-up" />
            Simulador de trading · datos de mercado reales
          </div>
          <h1 className="mx-auto max-w-3xl text-balance text-5xl font-bold leading-tight tracking-tight">
            Aprende a operar cripto con el mercado real.{" "}
            <span className="text-primary">Sin arriesgar un céntimo.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
            PaperMoon es un terminal de paper-trading con precios en vivo y una cartera 100% virtual.
            Practica estrategias, comete errores gratis y afina tu instinto.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button size="lg">Empezar a operar gratis</Button>
            </Link>
            <Link href="/markets">
              <Button size="lg" variant="outline">Ver mercados</Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 pb-20 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-surface p-6">
              <f.icon className="mb-3 h-6 w-6 text-primary" />
              <h3 className="mb-1 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8">
        <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-muted">
          <strong className="text-text">Aviso:</strong> PaperMoon es un simulador con fines educativos e
          informativos. No es asesoramiento financiero ni de inversión. No se usa dinero real ni se ejecutan
          operaciones reales; todos los fondos son virtuales. Los resultados simulados no representan trading
          real y el rendimiento pasado o simulado no garantiza resultados futuros. PaperMoon no está afiliado a
          ningún exchange. Datos de mercado ofrecidos «tal cual», sin garantía de exactitud.
        </p>
      </footer>
    </div>
  );
}
