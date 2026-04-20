/* Regras fiscais simplificadas para a POC. Valores didáticos, não para produção. */

import type { RetentionKind } from "@/types";

const ISS_RATES_SANTOS: Record<string, number> = {
  "20.01": 5,
  "20.03": 5,
  "transporte": 5,
};

export function calculateISS(options: {
  baseAmount: number;
  city: string;
  serviceCode?: string;
}): number {
  const rate = getISSRate(options);
  return round2((options.baseAmount * rate) / 100);
}

export function getISSRate(options: {
  city: string;
  serviceCode?: string;
}): number {
  const normalizedCity = options.city?.toLowerCase() ?? "";
  if (normalizedCity.includes("santos")) {
    if (options.serviceCode && ISS_RATES_SANTOS[options.serviceCode]) {
      return ISS_RATES_SANTOS[options.serviceCode];
    }
    return 5;
  }
  return 3;
}

export function calculateIRRF(baseAmount: number): number {
  return round2((baseAmount * 1.5) / 100);
}

export function calculatePISCOFINSCSLL(baseAmount: number): number {
  return round2((baseAmount * 4.65) / 100);
}

export function calculateINSS(options: {
  baseAmount: number;
  isLabor: boolean;
}): number {
  if (!options.isLabor) return 0;
  return round2((options.baseAmount * 11) / 100);
}

export function compareRetention(
  calculated: number,
  declared: number,
  tolerance = 0.01
): "ok" | "mismatch" {
  if (Math.abs(calculated - declared) <= tolerance) return "ok";
  return "mismatch";
}

export function labelForKind(kind: RetentionKind): string {
  return kind;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
