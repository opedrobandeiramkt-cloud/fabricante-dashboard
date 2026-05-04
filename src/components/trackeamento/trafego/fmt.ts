export function fmtBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function fmtPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function fmtNum(value: number): string {
  return value.toLocaleString("pt-BR");
}

export function fmtDate(date: string): string {
  return date;
}
