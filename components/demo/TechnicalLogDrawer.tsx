"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";
import { useDemoStore } from "@/lib/store";

export function TechnicalLogDrawer() {
  const [open, setOpen] = useState(false);
  const state = useDemoStore();
  const payload = {
    scenario: state.selectedScenario,
    autonomyMode: state.autonomyMode,
    invoice: state.invoice,
    purchaseOrder: state.purchaseOrder,
    goodsReceipt: state.goodsReceipt,
    match: state.match,
    retentions: state.retentions,
    decision: state.decision,
    runId: state.runId,
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Terminal className="h-4 w-4" aria-hidden />
          Ver log técnico detalhado
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[560px] sm:max-w-[560px]">
        <SheetHeader>
          <SheetTitle>Log técnico</SheetTitle>
          <SheetDescription>
            Estado final, trace das chamadas ao Claude Sonnet e eventos de
            auditoria desta execução.
          </SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="state" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="state">Estado</TabsTrigger>
            <TabsTrigger value="traces">
              Claude ({state.traces.length})
            </TabsTrigger>
            <TabsTrigger value="audit">
              Auditoria ({state.audit.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="state" className="mt-3">
            <pre className="max-h-[65vh] overflow-auto rounded-md bg-neutral-bg p-3 text-[11px] leading-relaxed text-neutral-ink">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </TabsContent>
          <TabsContent value="traces" className="mt-3 space-y-2">
            {state.traces.length === 0 ? (
              <EmptyHint>Nenhuma chamada ao Claude registrada ainda.</EmptyHint>
            ) : (
              state.traces.map((trace, idx) => (
                <div
                  key={idx}
                  className="rounded-md border border-black/5 bg-white p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-brand-purple">
                      {trace.step}
                    </span>
                    <span className="text-neutral-muted">
                      {trace.model} · {trace.latencyMs}ms
                    </span>
                  </div>
                  <div className="mt-1 text-neutral-muted">
                    in {trace.inputTokens} · out {trace.outputTokens} tokens{" "}
                    {trace.simulated ? "· (simulado na demo)" : ""}
                  </div>
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-neutral-bg p-2 text-[11px]">
                    {trace.promptPreview}
                  </pre>
                </div>
              ))
            )}
          </TabsContent>
          <TabsContent value="audit" className="mt-3">
            {state.audit.length === 0 ? (
              <EmptyHint>Eventos de auditoria aparecerão aqui.</EmptyHint>
            ) : (
              <ol className="space-y-1 font-mono text-[11px] leading-relaxed text-neutral-ink/80">
                {state.audit.map((event, idx) => (
                  <li key={idx}>
                    [{formatTime(event.timestamp)}] [{event.step}]{" "}
                    {event.action}
                    {event.detail ? ` — ${event.detail}` : ""}
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-black/10 bg-neutral-bg p-4 text-center text-xs text-neutral-muted">
      {children}
    </p>
  );
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toISOString().slice(11, 23);
  } catch {
    return iso;
  }
}
