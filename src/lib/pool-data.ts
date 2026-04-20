export interface PoolModel {
  id: string;
  name: string;
  line: string;
}

export interface PoolSize {
  id: string;
  modelId: string;
  dimensions: string;
  area: string;
  price: number;
  semiPastilha: boolean;
  pastilhaSize?: string;
}

export interface CasaDeMaquina {
  id: string;
  name: string;
  description: string;
  items: SerieItem[];
}

export interface SerieItem {
  name: string;
  qty: number;
  description?: string;
}

export interface HeatingOption {
  id: string;
  name: string;
  description: string;
  price: number;
}

export const defaultPoolModels: PoolModel[] = [
  { id: "navagio", name: "Navagio", line: "Tradicional" },
  { id: "italiana", name: "Italiana", line: "Tradicional" },
  { id: "monaco", name: "Monaco", line: "Premium" },
  { id: "bali", name: "Bali", line: "Premium" },
  { id: "cancun", name: "Cancún", line: "Tradicional" },
  { id: "ibiza", name: "Ibiza", line: "Premium" },
];

export const defaultPoolSizes: PoolSize[] = [
  { id: "navagio-p", modelId: "navagio", dimensions: "3,25 x 2,25 x 0,86", area: "7,31 m²", price: 17900, semiPastilha: false },
  { id: "navagio-m", modelId: "navagio", dimensions: "4,00 x 2,50 x 1,10", area: "10,00 m²", price: 22500, semiPastilha: false },
  { id: "navagio-g", modelId: "navagio", dimensions: "6,00 x 3,00 x 1,40", area: "18,00 m²", price: 32000, semiPastilha: false },
  { id: "italiana-p", modelId: "italiana", dimensions: "4,00 x 2,50 x 1,10", area: "10,00 m²", price: 23000, semiPastilha: false },
  { id: "italiana-m", modelId: "italiana", dimensions: "6,00 x 3,00 x 1,40", area: "18,00 m²", price: 33500, semiPastilha: false },
  { id: "italiana-g", modelId: "italiana", dimensions: "7,00 x 3,50 x 1,40", area: "24,50 m²", price: 42000, semiPastilha: false },
  { id: "monaco-p", modelId: "monaco", dimensions: "5,00 x 2,80 x 1,20", area: "14,00 m²", price: 29000, semiPastilha: false },
  { id: "monaco-m", modelId: "monaco", dimensions: "6,00 x 3,00 x 1,40", area: "18,00 m²", price: 36000, semiPastilha: false },
  { id: "monaco-g", modelId: "monaco", dimensions: "8,00 x 4,00 x 1,50", area: "32,00 m²", price: 55000, semiPastilha: false },
  { id: "bali-p", modelId: "bali", dimensions: "4,50 x 2,50 x 1,10", area: "11,25 m²", price: 25000, semiPastilha: false },
  { id: "bali-m", modelId: "bali", dimensions: "6,00 x 3,00 x 1,40", area: "18,00 m²", price: 35000, semiPastilha: false },
  { id: "bali-g", modelId: "bali", dimensions: "7,50 x 3,50 x 1,50", area: "26,25 m²", price: 48000, semiPastilha: false },
  { id: "cancun-p", modelId: "cancun", dimensions: "3,50 x 2,50 x 1,00", area: "8,75 m²", price: 19500, semiPastilha: false },
  { id: "cancun-m", modelId: "cancun", dimensions: "5,00 x 3,00 x 1,20", area: "15,00 m²", price: 27000, semiPastilha: false },
  { id: "cancun-g", modelId: "cancun", dimensions: "6,50 x 3,50 x 1,40", area: "22,75 m²", price: 38000, semiPastilha: false },
  { id: "ibiza-p", modelId: "ibiza", dimensions: "5,00 x 3,00 x 1,20", area: "15,00 m²", price: 31000, semiPastilha: false },
  { id: "ibiza-m", modelId: "ibiza", dimensions: "7,00 x 3,50 x 1,40", area: "24,50 m²", price: 45000, semiPastilha: false },
  { id: "ibiza-g", modelId: "ibiza", dimensions: "9,00 x 4,50 x 1,60", area: "40,50 m²", price: 68000, semiPastilha: false },
];

export function loadPoolModels(): PoolModel[] {
  try {
    const stored = localStorage.getItem("igui-pool-models");
    return stored ? JSON.parse(stored) : defaultPoolModels;
  } catch {
    return defaultPoolModels;
  }
}

export function savePoolModels(models: PoolModel[]) {
  localStorage.setItem("igui-pool-models", JSON.stringify(models));
}

export function loadPoolSizes(): PoolSize[] {
  try {
    const stored = localStorage.getItem("igui-pool-sizes");
    return stored ? JSON.parse(stored) : defaultPoolSizes;
  } catch {
    return defaultPoolSizes;
  }
}

export function savePoolSizes(sizes: PoolSize[]) {
  localStorage.setItem("igui-pool-sizes", JSON.stringify(sizes));
}

export const standardItems: SerieItem[] = [
  { name: "Iluminação iGUiLux Azul 5W", qty: 1 },
  { name: "Aquanível (Regulador Automático de Nível)", qty: 1 },
  { name: "Moto Bomba Auto Escorvante 1/2 CV", qty: 1, description: "Com protetor térmico e eixo de inox" },
  { name: "Filtro de Poliéster (Sistema Norte Americano)", qty: 1 },
  { name: "Regulador Automático do Nível da Piscina", qty: 1 },
  { name: "Dreno de Segurança Contra Inundações", qty: 1 },
  { name: "Hidroterapia Completa", qty: 6 },
  { name: "Registro para Retorno", qty: 1 },
  { name: "Registro para Drenagem", qty: 1 },
  { name: "Registro para Hidroterapia", qty: 1 },
  { name: "Registro para Cascata", qty: 1 },
  { name: "Dispositivo de Retorno", qty: 1 },
  { name: "Dispositivo de Espera do Aquecimento", qty: 1 },
  { name: "Sistema de Cabos Isolados", qty: 1 },
  { name: "Skimmer Filtrante", qty: 1 },
  { name: "Sistema Max", qty: 1 },
  { name: "Sistema Pratic", qty: 1 },
  { name: "Dreno de Nível", qty: 1 },
  { name: "Adaptador e Pré-Filtro", qty: 1 },
  { name: "Tampa de Proteção", qty: 1 },
  { name: "Dispositivo de Hidroterapia", qty: 1 },
  { name: "Manual de Instrução e Garantia", qty: 1 },
  { name: "Kit de Conexões para Duto Hidráulico Ecológico", qty: 1 },
  { name: "Duto Ecológico — Rolo 50m", qty: 1 },
  { name: "Mangueira de Aspiração Siliconada", qty: 1 },
  { name: "Cabo de Alumínio 3m Natural", qty: 1 },
  { name: "Catador Plus", qty: 1 },
  { name: "Aspirador", qty: 1 },
  { name: "Super Side", qty: 1 },
  { name: "Exclusividade iGUi", qty: 1 },
  { name: "Escavação + Instalação + Frete", qty: 1 },
];

export const casasDeMaquina: CasaDeMaquina[] = [
  {
    id: "dry-pump-plus",
    name: "Dry Pump Plus",
    description: "Casa de máquinas completa com proteção contra intempéries",
    items: standardItems,
  },
  {
    id: "dry-pump-standard",
    name: "Dry Pump Standard",
    description: "Casa de máquinas padrão com equipamentos essenciais",
    items: standardItems,
  },
];

export const heatingOptions: HeatingOption[] = [
  { id: "trocador", name: "Trocador de Calor", description: "Aquecimento elétrico eficiente para uso contínuo", price: 4500 },
  { id: "solar", name: "Aquecimento Solar", description: "Kit com placas coletoras solares, ecologicamente correto", price: 3200 },
];

export interface QuoteFormData {
  clientName: string;
  clientCity: string;
  clientEmail: string;
  clientAddress: string;
  sellerName: string;
  poolModelId: string;
  poolSizeId: string;
  heatingId: string | null;
  casaDeMaquinaId: string;
  includeClorador: boolean;
  proposalValue: number;
}

export type QuoteStatus = "pendente" | "ganho" | "perdido";

export interface SavedQuote {
  id: string;
  clientName: string;
  date: string;
  proposalValue: number;
  status: QuoteStatus;
  formData: QuoteFormData;
  vendedorId: string;
  vendedorName: string;
  storeId: string;
  wonAt?: string;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function loadQuotes(): SavedQuote[] {
  try {
    return JSON.parse(localStorage.getItem("igui-quotes") ?? "[]");
  } catch {
    return [];
  }
}

export function saveQuotes(quotes: SavedQuote[]) {
  localStorage.setItem("igui-quotes", JSON.stringify(quotes));
}
