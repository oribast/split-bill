"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import toast from "react-hot-toast";
import { calculateFinances, Finances } from "@/lib/calculations";
import { Room, Participant, Event } from "@/lib/types";

const fetcher = async (url: string) => {
  const editKey = typeof window !== "undefined" ? sessionStorage.getItem(`editKey_${url.split("/").pop()}`) : null;
  const pwd = typeof window !== "undefined" ? sessionStorage.getItem(`password_${url.split("/").pop()}`) : null;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (editKey) headers["x-edit-key"] = editKey;
  if (pwd) headers["Authorization"] = `Basic ${pwd}`;

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new Error("auth_required");
    throw new Error("fetch_failed");
  }
  const data = await res.json();
  return data.room as Room;
};

export default function RoomClient({ initialData, roomId }: { initialData: Room; roomId: string }) {
  const router = useRouter();
  const { data: room, mutate, isLoading, error } = useSWR<Room>(
    `/api/v1/rooms/${roomId}`,
    fetcher,
    { fallbackData: initialData, revalidateOnFocus: false }
  );

  const [theme, setTheme] = useState("light");
  const [isProtected, setIsProtected] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockPwd, setUnlockPwd] = useState("");
  const [saving, setSaving] = useState(false);

  // Forms
  const [newName, setNewName] = useState("");
  const [indId, setIndId] = useState("");
  const [indAmount, setIndAmount] = useState("");
  const [indPayer, setIndPayer] = useState("");
  const [indNote, setIndNote] = useState("");
  const [sharedAmount, setSharedAmount] = useState("");
  const [sharedPayer, setSharedPayer] = useState("");
  const [sharedIds, setSharedIds] = useState<string[]>([]);
  const [sharedNote, setSharedNote] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(t);
  }, []);

  useEffect(() => {
    if (!room) return;
    setIsProtected(!!room.passwordHash);
    if (room.passwordHash && typeof window !== "undefined") {
      const saved = sessionStorage.getItem(`password_${roomId}`);
      const unlocked = !!saved;
      setIsUnlocked(unlocked);
      setShowUnlock(!unlocked);
    } else {
      setIsUnlocked(true);
      setShowUnlock(false);
    }
  }, [room, roomId]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  const getHeaders = () => {
    const h: HeadersInit = { "Content-Type": "application/json" };
    const ek = sessionStorage.getItem(`editKey_${roomId}`);
    const pw = sessionStorage.getItem(`password_${roomId}`);
    if (ek) h["x-edit-key"] = ek;
    if (pw) h["Authorization"] = `Basic ${pw}`;
    return h;
  };

  const handleUnlock = async () => {
    if (!unlockPwd.trim()) return;
    setSaving(true);
    try {
      const auth = `Basic ${btoa(`admin:${unlockPwd.trim()}`)}`;
      const res = await fetch(`/api/v1/rooms/${roomId}`, { headers: { Authorization: auth } });
      if (res.ok) {
        sessionStorage.setItem(`password_${roomId}`, btoa(unlockPwd.trim()));
        setIsUnlocked(true);
        setShowUnlock(false);
        setUnlockPwd("");
        toast.success("Доступ получен");
        mutate();
      } else {
        toast.error("Неверный пароль");
      }
    } catch { toast.error("Ошибка сети"); }
    finally { setSaving(false); }
  };

  const lockRoom = () => {
    sessionStorage.removeItem(`password_${roomId}`);
    setIsUnlocked(false);
    setShowUnlock(true);
    toast("Редактирование заблокировано", { icon: "🔒" });
  };

  const addParticipant = async () => {
    if (!isUnlocked) return toast.error("Комната заблокирована");
    const name = newName.trim() || `Участник ${(room?.participants.length || 0) + 1}`;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}/participants`, {
        method: "POST", headers: getHeaders(), body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`${data.participant.name} добавлен`);
      setNewName("");
      mutate();
    } catch { toast.error("Ошибка добавления"); }
    finally { setSaving(false); }
  };

  const removeParticipant = async (pid: string) => {
    if (!isUnlocked) return toast.error("Комната заблокирована");
    if (!confirm("Удалить участника?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}/participants/${pid}`, { method: "DELETE", headers: getHeaders() });
      if (!res.ok) throw new Error();
      toast.success("Участник удалён");
      mutate();
    } catch { toast.error("Не удалось удалить"); }
    finally { setSaving(false); }
  };

  const saveName = async (pid: string, name: string) => {
    if (!isUnlocked) return;
    try {
      await fetch(`/api/v1/rooms/${roomId}/participants/${pid}`, {
        method: "PUT", headers: getHeaders(), body: JSON.stringify({ name })
      });
      mutate();
    } catch { /* silent */ }
  };

  const addIndividual = async () => {
    if (!isUnlocked) return toast.error("Комната заблокирована");
    if (!indId || !indAmount || !indPayer) return toast.error("Заполните все поля");
    const amt = Math.round(parseFloat(indAmount) * 100);
    if (amt <= 0) return toast.error("Сумма должна быть > 0");
    setSaving(true);
    try {
      const desc = `Лично: ${indAmount}₽ ${indNote ? `(${indNote})` : ""}`;
      const res = await fetch(`/api/v1/rooms/${roomId}/expenses/individual`, {
        method: "POST", headers: { ...getHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ description: desc, amount: amt, payerId: indPayer, targetParticipantId: indId })
      });
      if (!res.ok) throw new Error();
      toast.success("Начислено");
      setIndAmount(""); setIndNote(""); setIndId(""); setIndPayer("");
      mutate();
    } catch { toast.error("Ошибка создания"); }
    finally { setSaving(false); }
  };

  const addShared = async () => {
    if (!isUnlocked) return toast.error("Комната заблокирована");
    if (!sharedAmount || sharedIds.length === 0 || !sharedPayer) return toast.error("Заполните все поля");
    const amt = Math.round(parseFloat(sharedAmount) * 100);
    if (amt <= 0) return toast.error("Сумма должна быть > 0");
    setSaving(true);
    try {
      const names = room?.participants.filter(p => sharedIds.includes(p.id)).map(p => p.name).join(", ") || "";
      const desc = `Общее: ${sharedAmount}₽ на ${sharedIds.length} чел. ${sharedNote ? `(${sharedNote})` : ""}`;
      const res = await fetch(`/api/v1/rooms/${roomId}/expenses/shared`, {
        method: "POST", headers: { ...getHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ description: desc, amount: amt, payerId: sharedPayer, participantIds: sharedIds })
      });
      if (!res.ok) throw new Error();
      toast.success("Распределено");
      setSharedAmount(""); setSharedNote(""); setSharedPayer(""); setSharedIds([]);
      mutate();
    } catch { toast.error("Ошибка создания"); }
    finally { setSaving(false); }
  };

  const revertEvent = async (id: string) => {
    if (!isUnlocked) return toast.error("Комната заблокирована");
    if (!confirm("Откатить операцию?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}/events/${id}`, { method: "POST", headers: getHeaders() });
      if (!res.ok) throw new Error();
      toast.success("Операция отменена");
      mutate();
    } catch { toast.error("Не удалось откатить"); }
    finally { setSaving(false); }
  };

  if (error?.message === "auth_required" && !showUnlock) {
    setShowUnlock(true);
    setIsUnlocked(false);
  }

  if (isLoading && !room) return <div className="flex h-screen items-center justify-center text-muted">Загрузка...</div>;
  if (!room) return <div className="flex h-screen flex-col items-center justify-center gap-4"><h2 className="text-xl font-bold">Комната не найдена</h2><button onClick={() => router.push("/")} className="btn-primary px-6 py-2 rounded-lg">На главную</button></div>;

  const finances: Finances = calculateFinances(room.participants, room.events);
  const fmt = (v: number) => (v / 100).toFixed(2) + " ₽";

  return (
    <div className="min-h-screen bg-body p-4 md:p-8 text-primary font-sans">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{room.name || "Без названия"}</h1>
            <p className="text-xs text-muted font-mono mt-0.5">{roomId}</p>
          </div>
          <div className="flex items-center gap-2">
            {saving && <span className="text-xs text-muted animate-pulse">Сохранение...</span>}
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-card border border-border hover:bg-gray-100 dark:hover:bg-gray-700 transition" title="Тема">
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Ссылка скопирована"); }} className="p-2 rounded-lg bg-card border border-border hover:bg-gray-100 dark:hover:bg-gray-700 transition" title="Копировать ссылку">🔗</button>
            {isProtected && (
              <button onClick={isUnlocked ? lockRoom : () => setShowUnlock(true)} className={`px-3 py-1.5 text-sm rounded-lg border transition ${isUnlocked ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800" : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800"}`}>
                {isUnlocked ? "🔓 Открыто" : "🔒 Закрыто"}
              </button>
            )}
          </div>
        </header>

        {/* Unlock Modal */}
        {showUnlock && !isUnlocked && (
          <div className="mb-6 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="text-sm font-medium text-secondary mb-1 block">Пароль комнаты</label>
                <input type="password" value={unlockPwd} onChange={e => setUnlockPwd(e.target.value)} onKeyDown={e => e.key === "Enter" && handleUnlock()} className="w-full p-2.5 rounded-lg border border-border bg-input focus:border-accent focus:outline-none" placeholder="Введите пароль" />
              </div>
              <button onClick={handleUnlock} disabled={saving} className="btn-primary px-5 py-2.5 rounded-lg whitespace-nowrap">Войти</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Participants & Balances */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
              <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide mb-3">Участники</h2>
              {isUnlocked && (
                <div className="flex gap-2 mb-4">
                  <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addParticipant()} className="flex-1 p-2 rounded-lg border border-border bg-input text-sm focus:border-accent focus:outline-none" placeholder="Имя участника" />
                  <button onClick={addParticipant} disabled={saving} className="bg-accent text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent-hover transition">+</button>
                </div>
              )}
              <div className="space-y-2">
                {room.participants.length === 0 && <p className="text-center text-muted text-sm py-4">Пока пусто</p>}
                {room.participants.map(p => {
                  const bal = finances.balances[p.id] || 0;
                  const cons = finances.consumed[p.id] || 0;
                  const balColor = bal > 0 ? "text-red-500" : bal < 0 ? "text-green-500" : "text-muted";
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-item border border-transparent hover:border-border transition group">
                      <div className="flex-1 min-w-0">
                        {isUnlocked ? (
                          <input defaultValue={p.name} onBlur={e => saveName(p.id, e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-accent focus:outline-none text-sm font-medium truncate" />
                        ) : (
                          <span className="text-sm font-medium truncate block">{p.name}</span>
                        )}
                        <div className="text-xs text-muted mt-0.5">Потрачено: {fmt(cons)}</div>
                      </div>
                      <div className="text-right ml-3">
                        <div className={`text-sm font-mono font-bold ${balColor}`}>
                          {bal > 0 ? "+" : ""}{fmt(bal)}
                        </div>
                        <div className="text-[10px] text-muted">{bal > 0 ? "должен" : bal < 0 ? "вам должны" : "расчёт"}</div>
                      </div>
                      {isUnlocked && (
                        <button onClick={() => removeParticipant(p.id)} className="ml-2 opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition text-xs px-1">✕</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Forms & History */}
          <div className="lg:col-span-8 space-y-4">
            {/* Forms */}
            {isUnlocked && room.participants.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
                  <h3 className="text-sm font-semibold text-secondary mb-3">Личное начисление</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <select value={indId} onChange={e => setIndId(e.target.value)} className="p-2 rounded-lg border border-border bg-input text-sm"><option value="">Кому</option>{room.participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                      <select value={indPayer} onChange={e => setIndPayer(e.target.value)} className="p-2 rounded-lg border border-border bg-input text-sm"><option value="">Плательщик</option>{room.participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    </div>
                    <input type="number" step="0.01" min="0" value={indAmount} onChange={e => setIndAmount(e.target.value)} placeholder="Сумма ₽" className="w-full p-2 rounded-lg border border-border bg-input text-sm" />
                    <input value={indNote} onChange={e => setIndNote(e.target.value)} placeholder="Комментарий" className="w-full p-2 rounded-lg border border-border bg-input text-sm" />
                    <button onClick={addIndividual} disabled={saving || !indId || !indPayer} className="w-full py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition disabled:opacity-50">Начислить</button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
                  <h3 className="text-sm font-semibold text-secondary mb-3">Общее распределение</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" step="0.01" min="0" value={sharedAmount} onChange={e => setSharedAmount(e.target.value)} placeholder="Сумма ₽" className="p-2 rounded-lg border border-border bg-input text-sm" />
                      <select value={sharedPayer} onChange={e => setSharedPayer(e.target.value)} className="p-2 rounded-lg border border-border bg-input text-sm"><option value="">Плательщик</option>{room.participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    </div>
                    <input value={sharedNote} onChange={e => setSharedNote(e.target.value)} placeholder="Комментарий" className="w-full p-2 rounded-lg border border-border bg-input text-sm" />
                    <div className="flex gap-2 mb-1">
                      <button onClick={() => setSharedIds(room.participants.map(p => p.id))} className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition">Все</button>
                      <button onClick={() => setSharedIds([])} className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition">Снять</button>
                    </div>
                    <div className="max-h-24 overflow-y-auto p-2 rounded-lg bg-item border border-border grid grid-cols-2 gap-1">
                      {room.participants.map(p => (
                        <label key={p.id} className="flex items-center gap-1.5 cursor-pointer text-sm select-none">
                          <input type="checkbox" checked={sharedIds.includes(p.id)} onChange={() => setSharedIds(prev => prev.includes(p.id) ? prev.filter(i => i !== p.id) : [...prev, p.id])} className="rounded text-accent" />
                          <span className="truncate">{p.name}</span>
                        </label>
                      ))}
                    </div>
                    <button onClick={addShared} disabled={saving || sharedIds.length === 0} className="w-full py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">Распределить ({sharedIds.length})</button>
                  </div>
                </div>
              </div>
            )}

            {/* History */}
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
              <h3 className="text-sm font-semibold text-secondary mb-3">История операций</h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {room.events.length === 0 && <p className="text-center text-muted text-sm py-6">Операций пока нет</p>}
                {room.events.map(ev => (
                  <div key={ev.id} className={`p-3 rounded-lg border ${ev.isReverted ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60" : "bg-item border-border"}`}>
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{ev.description}</div>
                        <div className="text-xs text-muted mt-1 flex flex-wrap gap-2">
                          <span>{new Date(ev.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${ev.type === "shared" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"}`}>
                            {ev.type === "shared" ? "Общее" : "Личное"}
                          </span>
                          <span>Платил: {ev.payer?.name || "—"}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-sm">{fmt(ev.amount)}</div>
                        {isUnlocked && !ev.isReverted && (
                          <button onClick={() => revertEvent(ev.id)} className="text-xs text-red-500 hover:underline mt-1">Отмена</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}