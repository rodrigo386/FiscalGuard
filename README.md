# Fiscal Guardian — Demo POC (IAgentics × DP World)

POC web do **Fiscal Guardian**, agente autônomo de contas a pagar e validação fiscal da IAgentics. Esta aplicação **não** é o produto real — é a camada de apresentação usada em reunião comercial para mostrar, em 10 minutos, como o agente se comporta frente a três cenários canônicos de notas fiscais brasileiras.

## Stack

- Next.js 14 App Router (`output: "standalone"`)
- TypeScript estrito · Tailwind · shadcn/ui (Radix)
- Framer Motion · Zustand · Recharts · Lucide · Pino
- Anthropic TypeScript SDK — Claude Sonnet via rotas de API
- Docker multi-stage · Railway (healthcheck + auto-deploy GitHub)

## Setup local

```bash
cd fiscal-guardian-demo
npm install
cp .env.example .env.local
# edite .env.local e preencha ANTHROPIC_API_KEY
npm run dev
# http://localhost:3000
```

Smoke test:

```bash
curl http://localhost:3000/healthz
# { "status": "ok", "uptime": <numero>, "timestamp": "..." }
```

### Variáveis de ambiente

| Variável | Uso | Obrigatório |
|---|---|---|
| `ANTHROPIC_API_KEY` | Chave Sonnet para justificativa final e extração do upload livre | sim |
| `DEMO_STEP_DELAY_MS` | Delay base entre eventos SSE (padrão 1100ms, com jitter ±30%) | não |
| `LOG_LEVEL` | Nível pino (`trace`, `debug`, `info`, `warn`, `error`) | não |

**A chave nunca é exposta ao cliente.** Todas as chamadas ao Claude acontecem em rotas server-side (`/api/process`, `/api/explain`).

## Deploy na Railway (fluxo GitHub → auto-deploy)

O projeto é otimizado para **auto-deploy via GitHub**. Passo a passo:

1. Crie um repositório GitHub (privado):

   ```bash
   gh repo create fiscal-guardian-demo --private --source=. --remote=origin --push
   # ou crie pelo site e adicione o remote manualmente
   ```

2. No Railway:
   - `New Project` → `Deploy from GitHub repo` → selecione `fiscal-guardian-demo`
   - Railway detecta o `Dockerfile` automaticamente via `railway.json`
   - Em `Variables`, adicione `ANTHROPIC_API_KEY` como **sealed secret**

3. Aguarde o primeiro build (~3 minutos). Após o deploy, valide:

   ```bash
   curl https://<seu-projeto>.up.railway.app/healthz
   ```

4. Cada `git push origin main` dispara redeploy automático.

### Domínio customizado (opcional)

No Railway: `Settings` → `Domains` → `Custom Domain`. Configure um CNAME no seu DNS apontando para o hostname fornecido. Railway provisiona TLS automaticamente.

## Arquitetura rápida

```
app/
  page.tsx              → Landing (hero + 3 selos de ROI)
  demo/page.tsx         → Demo principal (40/60)
  dashboard/page.tsx    → Dashboard executivo (mocks)
  healthz/route.ts      → Healthcheck Railway
  api/
    process/route.ts    → SSE de processamento (mocked + custom upload)
    explain/route.ts    → Justificativa executiva via Claude

components/
  demo/                 → ScenarioCard, UploadZone, AgentCard, AgentTimeline,
                          ThreeWayMatchView, RetentionsTable, ConfidenceGauge,
                          TechnicalLogDrawer, AutonomyModeSelector
  dashboard/            → KPICards, HourlyChart, DocumentTypePie,
                          RecentInvoicesTable
  layout/SiteNavbar.tsx

lib/
  scenarios.ts          → 3 cenários canônicos com dados fiscais realistas
  mock-data.ts          → Dados do dashboard (KPIs, hourly, mix, tabela)
  anthropic.ts          → Cliente Claude Sonnet centralizado
  tax-rules.ts          → Regras fiscais simplificadas (ISS/IRRF/PIS/COFINS/CSLL)
  logger.ts             → Pino
  store.ts              → Zustand store do fluxo da demo
  use-sse-processing.ts → Hook cliente que consome o SSE

types/index.ts          → Tipos compartilhados
public/sample-nfse.xml  → Exemplo para testar upload livre
```

## Roteiro sugerido — 10 minutos

> Script para o Rodrigo conduzir. Tempos indicativos.

| Minuto | Tela | Ações + narrativa |
|---|---|---|
| 0:00–0:45 | `/` | Abre a landing. **Fala:** "Essa é a camada de apresentação do Fiscal Guardian. Vocês vão ver um agente autônomo processando três tipos clássicos de nota fiscal brasileira — e uma nota de vocês se quiserem." Aponta os 3 selos de ROI. Clica **Iniciar demo**. |
| 0:45–3:00 | `/demo` — Cenário 1 | Apresenta layout: "à esquerda escolhem cenário; à direita os 5 sub-agentes trabalham." Clica **100% Compliance**. Narra enquanto os cards se preenchem: "intake, extração, 3-way match, retenções, decisão. Score 97 — POSTED. Tudo automático." Quando terminar, expande o drawer de log técnico para mostrar JSON, trace de Claude e auditoria. |
| 3:00–5:00 | `/demo` — Cenário 2 | "E quando o fornecedor erra a alíquota de ISS?" Clica **Exceção fiscal**. Aponta o card de Retenções mostrando `R$ 4.115 calculado vs R$ 1.646 declarado`. Score 88 — HUMAN_REVIEW. Mostra a justificativa em PT-BR gerada pelo Claude. |
| 5:00–6:30 | `/demo` — Cenário 3 | "E quando o valor da nota não bate com o pedido?" Clica **Divergência 3-way match**. Aponta o campo `Preço unitário` em vermelho. Score 74 — HUMAN_REVIEW. "O agente não bloqueia o pagamento — ele pede confirmação com justificativa estruturada." |
| 6:30–8:00 | `/demo` — Upload livre | (Opcional — se o cliente pedir.) Arraste `public/sample-nfse.xml` (ou um XML real deles). Mostra extração via Claude Sonnet acontecendo ao vivo. Comenta: "PO e documento de recebimento estão simulados na demo — a nota é real, a integração com Oracle está mockada." |
| 8:00–9:30 | `/dashboard` | Mostra como fica em produção. Aponta cada KPI: 247 notas hoje, 82% touchless rate, 3min42s de tempo médio por nota. Explica o gráfico stacked: verde = automáticas, roxo = revisão. |
| 9:30–10:00 | Perguntas | Fecha: "Tudo que vocês viram é audit-friendly — cada decisão tem trace, log e justificativa executiva. A próxima fase é conectar o Oracle Fusion real e a SEFAZ." |

## Scripts úteis

```bash
npm run dev      # dev server com hot-reload
npm run build    # build standalone (usado no Docker)
npm run start    # servir o build localmente
npm run lint     # eslint
```

### Rodar o build standalone localmente

```bash
npm run build
PORT=3000 node .next/standalone/server.js
```

## O que NÃO está incluído

- Integração real com Oracle Fusion, SEFAZ, Azure Document Intelligence — tudo mockado
- LangGraph/Python/workflows de produção — essa camada é apenas apresentação
- Persistência entre sessões (sem banco)
- Autenticação (demo aberta)

## Observabilidade

Logs estruturados saem via `pino`. No Railway dashboard, acompanhe:
- `Iniciando processamento` — início de cada run
- `Processamento concluído` — fim
- `Falha Claude` — erros de upstream (fallback ativado)

## Licença

Código interno IAgentics. Uso restrito à demonstração comercial.
