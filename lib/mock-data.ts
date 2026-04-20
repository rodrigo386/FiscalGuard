/* Dados mockados estaticamente para o dashboard executivo. */

export interface KPI {
  label: string;
  value: string;
  trend: string;
  trendTone: "positive" | "neutral" | "negative";
}

export const KPIS: KPI[] = [
  {
    label: "Notas processadas hoje",
    value: "247",
    trend: "+18% vs. média",
    trendTone: "positive",
  },
  {
    label: "Touchless rate",
    value: "82%",
    trend: "Meta trimestre: 85%",
    trendTone: "neutral",
  },
  {
    label: "Tempo médio por nota",
    value: "3min 42s",
    trend: "−41% vs. baseline",
    trendTone: "positive",
  },
  {
    label: "Economia em early payment",
    value: "R$ 18.400",
    trend: "Esta semana",
    trendTone: "positive",
  },
];

export interface HourlyPoint {
  hour: string;
  processed: number;
  humanReview: number;
}

export const HOURLY_POINTS: HourlyPoint[] = [
  { hour: "00h", processed: 2, humanReview: 0 },
  { hour: "01h", processed: 1, humanReview: 0 },
  { hour: "02h", processed: 0, humanReview: 0 },
  { hour: "03h", processed: 1, humanReview: 0 },
  { hour: "04h", processed: 0, humanReview: 0 },
  { hour: "05h", processed: 2, humanReview: 0 },
  { hour: "06h", processed: 6, humanReview: 1 },
  { hour: "07h", processed: 11, humanReview: 1 },
  { hour: "08h", processed: 22, humanReview: 3 },
  { hour: "09h", processed: 34, humanReview: 4 },
  { hour: "10h", processed: 41, humanReview: 6 },
  { hour: "11h", processed: 37, humanReview: 5 },
  { hour: "12h", processed: 20, humanReview: 3 },
  { hour: "13h", processed: 28, humanReview: 4 },
  { hour: "14h", processed: 31, humanReview: 5 },
  { hour: "15h", processed: 8, humanReview: 2 },
  { hour: "16h", processed: 3, humanReview: 1 },
  { hour: "17h", processed: 0, humanReview: 0 },
  { hour: "18h", processed: 0, humanReview: 0 },
  { hour: "19h", processed: 0, humanReview: 0 },
  { hour: "20h", processed: 0, humanReview: 0 },
  { hour: "21h", processed: 0, humanReview: 0 },
  { hour: "22h", processed: 0, humanReview: 0 },
  { hour: "23h", processed: 0, humanReview: 0 },
];

export interface DocTypeSlice {
  name: string;
  value: number;
  color: string;
}

export const DOC_TYPE_SLICES: DocTypeSlice[] = [
  { name: "NFSe", value: 52, color: "#1D9E75" },
  { name: "CTe", value: 31, color: "#6B46C1" },
  { name: "NFe", value: 14, color: "#F59E0B" },
  { name: "Outros", value: 3, color: "#9CA3AF" },
];

export type RecentStatus = "POSTED" | "HUMAN_REVIEW" | "REJECTED";

export interface RecentInvoice {
  id: string;
  time: string;
  supplier: string;
  amount: string;
  type: "NFSe" | "CTe" | "NFe";
  status: RecentStatus;
  score: number;
}

export const RECENT_INVOICES: RecentInvoice[] = [
  {
    id: "r-1",
    time: "14:52",
    supplier: "Operadora Portuária Santos Ltda",
    amount: "R$ 47.500,00",
    type: "NFSe",
    status: "POSTED",
    score: 97,
  },
  {
    id: "r-2",
    time: "14:48",
    supplier: "Rodovias do Sul Transportes S.A.",
    amount: "R$ 82.300,00",
    type: "CTe",
    status: "HUMAN_REVIEW",
    score: 88,
  },
  {
    id: "r-3",
    time: "14:41",
    supplier: "LogFlex Armazéns Gerais",
    amount: "R$ 12.870,00",
    type: "NFSe",
    status: "POSTED",
    score: 96,
  },
  {
    id: "r-4",
    time: "14:33",
    supplier: "Equipamentos Industriais Brasil Ltda",
    amount: "R$ 15.800,00",
    type: "NFe",
    status: "HUMAN_REVIEW",
    score: 74,
  },
  {
    id: "r-5",
    time: "14:24",
    supplier: "Praticagem Baía de Santos",
    amount: "R$ 9.240,00",
    type: "NFSe",
    status: "POSTED",
    score: 99,
  },
  {
    id: "r-6",
    time: "14:18",
    supplier: "Norton Lilly Brasil",
    amount: "R$ 28.100,00",
    type: "NFSe",
    status: "POSTED",
    score: 95,
  },
  {
    id: "r-7",
    time: "14:09",
    supplier: "Transmar Logística",
    amount: "R$ 63.900,00",
    type: "CTe",
    status: "POSTED",
    score: 94,
  },
  {
    id: "r-8",
    time: "14:02",
    supplier: "Unisantos Terminal",
    amount: "R$ 102.550,00",
    type: "NFSe",
    status: "HUMAN_REVIEW",
    score: 81,
  },
  {
    id: "r-9",
    time: "13:56",
    supplier: "Localiza Gestão de Frotas",
    amount: "R$ 3.480,00",
    type: "NFe",
    status: "POSTED",
    score: 98,
  },
  {
    id: "r-10",
    time: "13:47",
    supplier: "Aduaneiros Associados",
    amount: "R$ 17.220,00",
    type: "NFSe",
    status: "POSTED",
    score: 96,
  },
];
