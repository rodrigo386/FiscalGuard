import Link from "next/link";
import { ArrowRight, Clock, Gauge, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const roiStats = [
  {
    icon: Clock,
    value: "60%",
    label: "Redução de tempo de processamento",
  },
  {
    icon: Gauge,
    value: "99%",
    label: "Acurácia em extração e 3-way match",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-16 pt-10">
      <section className="flex flex-col items-center gap-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-teal/20 bg-brand-teal-light px-3 py-1 text-sm font-medium text-brand-teal">
          <Sparkles className="h-4 w-4" aria-hidden />
          Demonstração técnica para DP World Brasil
        </span>
        <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-tight text-neutral-ink">
          Fiscal Guardian — Agente Autônomo de Contas a Pagar
        </h1>
        <p className="max-w-2xl text-balance text-lg text-neutral-muted">
          Processa NFSe, CTe e NFe brasileiras com 3-way match, validação de
          retenções fiscais e trilha de auditoria completa. Cada decisão é
          justificada em linguagem natural.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 bg-brand-teal px-6 text-base font-semibold hover:bg-brand-teal-dark"
          >
            <Link href="/demo">
              Iniciar demo
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 px-6 text-base"
          >
            <Link href="/dashboard">Ver dashboard executivo</Link>
          </Button>
        </div>
      </section>

      <section
        aria-label="Indicadores de ROI estimado"
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {roiStats.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="flex items-start gap-4 rounded-xl border border-black/5 bg-white p-6 shadow-card"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-teal-light text-brand-teal">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <div className="text-3xl font-semibold tracking-tight text-neutral-ink">
                {value}
              </div>
              <div className="mt-1 text-sm text-neutral-muted">{label}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-8 shadow-card">
        <h2 className="text-xl font-semibold text-neutral-ink">
          O que você verá nos próximos 10 minutos
        </h2>
        <ol className="mt-4 grid gap-4 text-sm text-neutral-ink md:grid-cols-2 xl:grid-cols-4">
          <li className="rounded-lg border border-black/5 bg-neutral-bg p-4">
            <div className="font-semibold text-brand-purple">
              1 · 100% Compliance
            </div>
            <p className="mt-1 text-neutral-muted">
              NFSe portuária com PO, evidência de serviço e retenções
              corretas — aprovação automática.
            </p>
          </li>
          <li className="rounded-lg border border-black/5 bg-neutral-bg p-4">
            <div className="font-semibold text-brand-purple">
              2 · Exceção fiscal
            </div>
            <p className="mt-1 text-neutral-muted">
              CTe com ICMS destacado em alíquota incorreta — encaminhado para
              revisão.
            </p>
          </li>
          <li className="rounded-lg border border-black/5 bg-neutral-bg p-4">
            <div className="font-semibold text-brand-purple">
              3 · Divergência 3-way match
            </div>
            <p className="mt-1 text-neutral-muted">
              NFe MRO com valor acima da tolerância do pedido — bloqueio com
              justificativa.
            </p>
          </li>
          <li className="rounded-lg border border-brand-teal/20 bg-brand-teal-light/40 p-4">
            <div className="font-semibold text-brand-teal">
              4 · REPORTO
            </div>
            <p className="mt-1 text-neutral-muted">
              Aquisição de guindaste portuário com PIS/COFINS/IPI suspensos —
              agente confirma enquadramento no regime especial.
            </p>
          </li>
        </ol>
      </section>
    </div>
  );
}
