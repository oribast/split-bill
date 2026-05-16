export const formatDate = (val: unknown): string => {
  if (val == null) return "—";
  
  let date: Date;
  if (val instanceof Date) {
    date = val;
  } else if (typeof val === "number") {
    date = new Date(val);
  } else if (typeof val === "string") {
    date = new Date(val.includes(" ") && !val.includes("T") ? val.replace(" ", "T") : val);
  } else {
    return "—";
  }

  if (isNaN(date.getTime())) return "—";

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const parseDescription = (desc: string) => {
  if (!desc) return { main: "", comment: null };
  const match = desc.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (!match) return { main: desc, comment: null };
  const [, main, potential] = match;
  if (/^\d+\s*чел\.?:/.test(potential)) return { main: desc, comment: null };
  return { main: main.trim(), comment: potential.trim() };
};

export const fmt = (v: number) => (v / 100).toFixed(2) + " ₽";