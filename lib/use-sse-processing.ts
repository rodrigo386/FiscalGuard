"use client";

import { useCallback, useRef } from "react";
import { useDemoStore } from "@/lib/store";
import type { AutonomyMode, ScenarioKey, SSEEvent } from "@/types";

export function useSSEProcessing() {
  const store = useDemoStore();
  const abortRef = useRef<AbortController | null>(null);

  const runScenario = useCallback(
    async (
      scenario: ScenarioKey,
      autonomyMode: AutonomyMode,
      file?: File,
      poFile?: File
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      store.beginRun(scenario);

      try {
        let body: BodyInit;
        let headers: HeadersInit;
        if (file) {
          const fd = new FormData();
          fd.set("scenario", scenario);
          fd.set("autonomyMode", autonomyMode);
          fd.set("file", file);
          if (poFile) fd.set("poFile", poFile);
          body = fd;
          headers = {};
        } else {
          body = JSON.stringify({ scenario, autonomyMode });
          headers = { "Content-Type": "application/json" };
        }

        const response = await fetch("/api/process", {
          method: "POST",
          body,
          headers,
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Falha na resposta: HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let runId: string | null = null;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const rawEvent of events) {
            const dataLine = rawEvent
              .split("\n")
              .find((line) => line.startsWith("data:"));
            if (!dataLine) continue;
            try {
              const parsed: SSEEvent = JSON.parse(dataLine.slice(5).trim());
              if (parsed.type === "done") {
                runId = parsed.payload.runId;
              } else {
                store.ingest(parsed);
              }
            } catch (err) {
              console.error("Falha ao parse SSE event", err, rawEvent);
            }
          }
        }

        store.finish(runId ?? crypto.randomUUID());
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message =
          err instanceof Error ? err.message : "Erro inesperado no processamento";
        store.fail(message);
      }
    },
    [store]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { runScenario, cancel };
}
