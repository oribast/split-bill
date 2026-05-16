export const formatDate = (val: any) => {
  if (!val) return "—";
  try {
    const d = typeof val === "string" ? new Date(val) : val;
    if (!(d instanceof Date) || isNaN(d.getTime())) return "—";
    return d.toLocaleString("ru-RU", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  } catch { return "—"; }
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