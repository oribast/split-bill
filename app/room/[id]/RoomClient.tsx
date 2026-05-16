"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import toast from "react-hot-toast";
import { calculateFinances } from "@/lib/calculations";
import { Room } from "@/lib/types";
import {
  IconLock, IconUnlock, IconEye, IconEyeOff, IconSun, IconMoon,
  IconLink, IconPlus, IconTrash, IconRefresh, IconUsers, IconHistory, IconRollback
} from "@/components/Icons";

// --- Утилиты ---
const formatDate = (val: any) => {
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

const parseDescription = (desc: string) => {
  if (!desc) return { main: "", comment: null };
  const match = desc.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (!match) return { main: desc, comment: null };
  const [, main, potential] = match;
  if (/^\d+\s*чел\.?:/.test(potential)) return { main: desc, comment: null };
  return { main: main.trim(), comment: potential.trim() };
};

const fetcher = async (url: string) => {
  const roomId = url.split("/").pop();
  const editKey = typeof window !== "undefined" ? sessionStorage.getItem(`editKey_${roomId}`) : null;
  const pwd = typeof window !== "undefined" ? sessionStorage.getItem(`password_${roomId}`) : null;
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
    `/api/v1/rooms/${roomId}`, fetcher,
    { fallbackData: initialData, revalidateOnFocus: false }
  );

  const [theme, setTheme] = useState("light");
  const [isProtected, setIsProtected] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [showUnlockForm, setShowUnlockForm] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [showUnlockPwd, setShowUnlockPwd] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [individualAmount, setIndividualAmount] = useState("");
  const [individualNote, setIndividualNote] = useState("");
  const [payerId, setPayerId] = useState("");
  const [sharedAmount, setSharedAmount] = useState("");
  const [sharedNote, setSharedNote] = useState("");
  const [sharedPayerId, setSharedPayerId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setTheme(document.documentElement.getAttribute("data-theme") || "light");
  }, []);

  useEffect(() => {
    if (!room) return;
    setIsProtected(!!room.passwordHash);
    if (room.passwordHash && typeof window !== "undefined") {
      const saved = sessionStorage.getItem(`password_${roomId}`);
      const unlocked = !!saved;
      setIsUnlocked(unlocked);
      setShowUnlockForm(!unlocked);
    } else {
      setIsUnlocked(true);
      setShowUnlockForm(false);
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
    const ek = typeof window !== "undefined" ? sessionStorage.getItem(`editKey_${roomId}`) : null;
    const pw = typeof window !== "undefined" ? sessionStorage.getItem(`password_${roomId}`) : null;
    if (ek) h["x-edit-key"] = ek;
    if (pw) h["Authorization"] = `Basic ${pw}`;
    return h;
  };

  const handleFetchError = (res: Response) => {
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== "undefined") sessionStorage.removeItem(`password_${roomId}`);
      setIsUnlocked(false);
      setShowUnlockForm(true);
      setUnlockError("Неверный пароль или доступ запрещён");
      toast.error("Требуется пароль");
      return true;
    }
    return false;
  };

  const tryUnlock = async () => {
    if (!unlockPassword.trim()) return;
    setSaving(true); setUnlockError("");
    try {
      const auth = `Basic ${btoa(`admin:${unlockPassword.trim()}`)}`;
      const res = await fetch(`/api/v1/rooms/${roomId}`, { headers: { Authorization: auth } });
      if (res.ok) {
        if (typeof window !== "undefined") sessionStorage.setItem(`password_${roomId}`, btoa(unlockPassword.trim()));
        setIsUnlocked(true); setShowUnlockForm(false); setUnlockPassword(""); setShowUnlockPwd(false);
        toast.success("Комната разблокирована"); mutate();
      } else { setUnlockError("Неверный пароль"); toast.error("Неверный пароль"); }
    } catch { setUnlockError("Ошибка сети"); toast.error("Ошибка сети"); }
    finally { setSaving(false); }
  };

  const lockRoom = () => {
    if (window.confirm("Заблокировать редактирование?")) {
      if (typeof window !== "undefined") sessionStorage.removeItem(`password_${roomId}`);
      setIsUnlocked(false); setShowUnlockForm(true); setUnlockPassword(""); setUnlockError("");
      toast("Редактирование заблокировано", { icon: "🔒" });
    }
  };

  const addParticipant = async () => {
    if (!isUnlocked) return toast.error("Комната защищена паролем");
    const name = newName.trim() || `Участник ${(room?.participants.length || 0) + 1}`;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}/participants`, {
        method: "POST", headers: getHeaders(), body: JSON.stringify({ name })
      });
      if (handleFetchError(res)) return;
      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.participant.name} добавлен`); setNewName(""); mutate();
      } else toast.error("Ошибка добавления");
    } catch { toast.error("Ошибка сети"); }
    finally { setSaving(false); }
  };

  const removeParticipant = async (pid: string) => {
    if (!isUnlocked) return toast.error("Комната защищена паролем");
    const p = room?.participants.find(x => x.id === pid);
    if (!window.confirm(`Удалить ${p?.name || "участника"}?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}/participants/${pid}`, { method: "DELETE", headers: getHeaders() });
      if (handleFetchError(res)) return;
      if (res.ok) {
        toast.success(`${p?.name || "Участник"} удалён`);
        setSelectedIds(prev => prev.filter(sid => sid !== pid));
        if (selectedId === pid) setSelectedId("");
        if (payerId === pid) setPayerId("");
        if (sharedPayerId === pid) setSharedPayerId("");
        mutate();
      } else toast.error("Ошибка удаления");
    } catch { toast.error("Ошибка удаления"); }
    finally { setSaving(false); }
  };

  const updateName = (pid: string, name: string) => {
    mutate(prev => prev ? { ...prev, participants: prev.participants.map(p => p.id === pid ? { ...p, name } : p) } : prev, { revalidate: false });
  };

  const saveName = async (pid: string, name: string) => {
    if (!isUnlocked) return;
    try {
      await fetch(`/api/v1/rooms/${roomId}/participants/${pid}`, {
        method: "PUT", headers: getHeaders(), body: JSON.stringify({ name })
      });
      mutate();
    } catch { toast.error("Ошибка сохранения имени"); }
  };

  const addToParticipant = async () => {
    if (!isUnlocked) return toast.error("Комната защищена паролем");
    if (!selectedId || !individualAmount || !payerId) return toast.error("Выберите участника, плательщика и сумму");
    const amount = parseFloat(individualAmount);
    if (isNaN(amount) || amount <= 0) return toast.error("Введите корректную сумму");
    setSaving(true);
    try {
      const p = room?.participants.find(x => x.id === selectedId);
      const notePart = individualNote.trim() ? ` (${individualNote.trim()})` : "";
      const desc = `Начислено ${amount.toFixed(2)} ₽ участнику ${p?.name || ""}${notePart}`;
      const res = await fetch(`/api/v1/rooms/${roomId}/expenses/individual`, {
        method: "POST", headers: { ...getHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ description: desc, amount: Math.round(amount * 100), payerId, targetParticipantId: selectedId })
      });
      if (handleFetchError(res)) return;
      if (res.ok) {
        toast.success(`Начислено ${amount.toFixed(2)} ₽`);
        setIndividualAmount(""); setIndividualNote(""); setSelectedId(""); setPayerId(""); mutate();
      } else toast.error("Ошибка начисления");
    } catch { toast.error("Ошибка сети"); }
    finally { setSaving(false); }
  };

  const distributeShared = async () => {
    if (!isUnlocked) return toast.error("Комната защищена паролем");
    if (!sharedAmount || selectedIds.length === 0 || !sharedPayerId) return toast.error("Введите сумму, выберите участников и плательщика");
    const amount = parseFloat(sharedAmount);
    if (isNaN(amount) || amount <= 0) return toast.error("Введите корректную сумму");
    setSaving(true);
    try {
      const names = room?.participants.filter(p => selectedIds.includes(p.id)).map(p => p.name).join(", ") || "";
      const notePart = sharedNote.trim() ? ` (${sharedNote.trim()})` : "";
      const desc = `Распределено ${amount.toFixed(2)} ₽ (${selectedIds.length} чел.: ${names})${notePart}`;
      const res = await fetch(`/api/v1/rooms/${roomId}/expenses/shared`, {
        method: "POST", headers: { ...getHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ description: desc, amount: Math.round(amount * 100), payerId: sharedPayerId, participantIds: selectedIds })
      });
      if (handleFetchError(res)) return;
      if (res.ok) {
        toast.success(`Распределено ${amount.toFixed(2)} ₽`);
        setSharedAmount(""); setSharedNote(""); setSharedPayerId(""); setSelectedIds([]); mutate();
      } else toast.error("Ошибка распределения");
    } catch { toast.error("Ошибка сети"); }
    finally { setSaving(false); }
  };

  const toggleSelectedId = (pid: string) => setSelectedIds(prev => prev.includes(pid) ? prev.filter(i => i !== pid) : [...prev, pid]);
  const selectAll = () => setSelectedIds(room?.participants.map(p => p.id) || []);
  const deselectAll = () => setSelectedIds([]);

  const handleRollback = async (eventId: string) => {
    if (!isUnlocked) return toast.error("Комната защищена паролем");
    if (!window.confirm("Откатить эту операцию?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}/events/${eventId}`, { method: "POST", headers: getHeaders() });
      if (handleFetchError(res)) return;
      if (res.ok) { toast.success("Операция откачена"); mutate(); }
      else toast.error("Не удалось откатить");
    } catch { toast.error("Ошибка сети"); }
    finally { setSaving(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success("Ссылка скопирована!"))
      .catch(() => toast.error("Не удалось скопировать"));
  };

  const sharedPreview = (() => {
    if (!sharedAmount || selectedIds.length === 0) return null;
    const amount = parseFloat(sharedAmount);
    if (isNaN(amount) || amount <= 0) return null;
    const totalCents = Math.round(amount * 100);
    const count = selectedIds.length;
    const baseCents = Math.floor(totalCents / count);
    let remainderCents = totalCents - baseCents * count;
    return selectedIds.map(pid => {
      let addCents = baseCents;
      if (remainderCents > 0) { addCents += 1; remainderCents -= 1; }
      const p = room?.participants.find(x => x.id === pid);
      return { name: p?.name || "Удалённый", amount: addCents / 100 };
    });
  })();

  if (isLoading && !room) return <div className="container" style={{textAlign:'center', paddingTop:'80px'}}><h1>Загрузка...</h1></div>;
  if (error?.message === "fetch_failed" && !room) return (
    <div className="container" style={{textAlign:'center', paddingTop:'80px'}}>
      <h1>Ошибка</h1>
      <p style={{color:'var(--text-secondary)', marginBottom:'24px'}}>Комната не найдена или ошибка загрузки</p>
      <button className="btn-primary" onClick={() => router.push("/")}>На главную</button>
    </div>
  );

  const finances = room ? calculateFinances(room.participants, room.events) : { balances: {}, consumed: {}, paid: {} };
  const fmt = (v: number) => (v / 100).toFixed(2) + " ₽";

  return (
    <div className="mx-auto max-w-6xl px-3 py-5">
      {/* Header */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px", flexWrap:"wrap", gap:"10px"}}>
        <h1 style={{marginBottom:0, fontSize:"1.75rem", fontWeight:700}}>Комната: {roomId}</h1>
        <div style={{display:"flex", alignItems:"center", gap:"6px"}}>
          {saving && <span style={{color:"var(--text-muted)", fontSize:"0.8rem"}}>Сохранение...</span>}
          <button className="theme-toggle btn-small" onClick={toggleTheme} title={theme==="light"?"Тёмная тема":"Светлая тема"}>
            {theme==="light" ? <IconMoon className="w-4 h-4"/> : <IconSun className="w-4 h-4"/>}
          </button>
          {isProtected && (
            isUnlocked ? (
              <button className="btn-small btn-secondary" onClick={lockRoom} style={{display:"flex", alignItems:"center", gap:"5px"}}>
                <IconUnlock className="w-4 h-4"/> Открыто
              </button>
            ) : (
              <button className="btn-small btn-secondary" onClick={()=>setShowUnlockForm(!showUnlockForm)} style={{display:"flex", alignItems:"center", gap:"5px"}}>
                <IconLock className="w-4 h-4"/> Заблокировано
              </button>
            )
          )}
          <button className="btn-secondary btn-small" onClick={copyLink} style={{display:"flex", alignItems:"center", gap:"5px"}}>
            <IconLink className="w-4 h-4"/> Ссылка
          </button>
        </div>
      </div>

      {/* Unlock Form */}
      {isProtected && !isUnlocked && showUnlockForm && (
        <div className="card unlock-card" style={{padding:"16px", marginBottom:"16px"}}>
          <h3 className="unlock-title" style={{fontSize:"0.95rem", marginBottom:"10px"}}>
            <IconLock className="w-4 h-4"/> Введите пароль комнаты
          </h3>
          <div style={{display:"flex", gap:"10px", alignItems:"flex-start", flexWrap:"wrap"}}>
            <div className="password-field" style={{flex:1, minWidth:"180px", padding:"8px 12px"}}>
              <IconLock className="w-4 h-4"/>
              <input type={showUnlockPwd?"text":"password"} value={unlockPassword} onChange={(e)=>{setUnlockPassword(e.target.value); setUnlockError("");}} placeholder="Пароль" onKeyDown={(e)=>e.key==="Enter" && tryUnlock()} autoFocus style={{fontSize:"0.9rem"}} />
              <button type="button" className="password-toggle" onClick={()=>setShowUnlockPwd(!showUnlockPwd)} title={showUnlockPwd?"Скрыть":"Показать"}>
                {showUnlockPwd ? <IconEyeOff className="w-4 h-4"/> : <IconEye className="w-4 h-4"/>}
              </button>
            </div>
            <button className="btn-primary" onClick={tryUnlock} style={{padding:"8px 16px", fontSize:"0.9rem"}}>Разблокировать</button>
          </div>
          {unlockError && <p style={{color:"#e53e3e", fontSize:"0.8rem", marginTop:"6px"}}>{unlockError}</p>}
        </div>
      )}

      {/* Layout: Sidebar + Main */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* LEFT SIDEBAR */}
        <aside className="w-full lg:w-80 lg:min-w-[320px] flex-shrink-0">
          <div className="card" style={{position:"sticky", top:"16px", padding:"16px"}}>
            <h2 style={{fontSize:"1.1rem", marginBottom:"12px"}}>Участники</h2>
            {!isUnlocked ? null : (
              <div className="form-row" style={{marginBottom:"12px", gap:"8px"}}>
                <div className="form-group" style={{flex:1}}>
                  <label style={{fontSize:"0.8rem"}}>Имя</label>
                  <input type="text" value={newName} onChange={(e)=>setNewName(e.target.value)} placeholder="Например, Алексей" onKeyDown={(e)=>e.key==="Enter" && addParticipant()} autoFocus={room?.participants.length===0} style={{padding:"8px", fontSize:"0.9rem"}} />
                </div>
                <button className="btn-primary" onClick={addParticipant} style={{padding:"8px 12px", fontSize:"0.9rem", display:"flex", alignItems:"center", gap:"4px"}}>
                  <IconPlus className="w-4 h-4"/> Добавить
                </button>
              </div>
            )}
            {(!room || room.participants.length===0) ? (
              <div className="empty-state" style={{padding:"24px 16px"}}>
                <IconUsers className="w-8 h-8 mx-auto mb-2 text-muted"/>
                <div className="empty-title" style={{fontSize:"1rem"}}>Пока нет участников</div>
                <div className="empty-subtitle" style={{fontSize:"0.85rem"}}>Добавьте первого, чтобы начать делить счёт</div>
              </div>
            ) : (
              <div className="participants-list" style={{gap:"8px"}}>
                {room.participants.map(p=>{
                  const bal = finances.balances[p.id] || 0;
                  const balColor = bal > 0 ? "text-red-500" : bal < 0 ? "text-green-500" : "text-muted";
                  const balLabel = bal > 0 ? "должен" : bal < 0 ? "вам должны" : "расчёт";
                  return (
                    <div key={p.id} className="participant-item" style={{flexDirection:"column", alignItems:"stretch", gap:"6px", padding:"10px"}}>
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                        {isUnlocked ? (
                          <input type="text" value={p.name} onChange={(e)=>updateName(p.id, e.target.value)} onBlur={(e)=>saveName(p.id, e.target.value)} style={{flex:1, fontSize:"0.9rem", padding:"4px"}} />
                        ) : (
                          <span style={{flex:1, fontWeight:500, fontSize:"0.9rem"}}>{p.name}</span>
                        )}
                        {!isUnlocked ? null : (
                          <button className="btn-secondary btn-small" onClick={()=>removeParticipant(p.id)} style={{marginLeft:"6px", padding:"4px 8px", display:"flex", alignItems:"center"}}>
                            <IconTrash className="w-3.5 h-3.5"/>
                          </button>
                        )}
                      </div>
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
                        <span style={{fontSize:"0.75rem", color:"var(--text-muted)"}}>Баланс:</span>
                        <span className={`participant-amount ${balColor}`} style={{minWidth:"auto", fontSize:"0.9rem"}}>
                          {bal > 0 ? "+" : ""}{fmt(bal)} <span style={{fontSize:"0.7rem", fontWeight:400, color:"var(--text-muted)"}}>({balLabel})</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT MAIN */}
        <main className="flex-1 min-w-0 space-y-5">
          {!isUnlocked || !room || room.participants.length===0 ? null : (
            <>
              <div className="card" style={{padding:"16px"}}>
                <h2 style={{fontSize:"1.1rem", marginBottom:"12px"}}>Накинуть сумму конкретному человеку</h2>
                <div className="form-row" style={{gap:"10px"}}>
                  <div className="form-group"><label style={{fontSize:"0.8rem"}}>Кому</label><select value={selectedId} onChange={(e)=>setSelectedId(e.target.value)} style={{padding:"8px", fontSize:"0.9rem"}}><option value="">Выберите участника</option>{room.participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                  <div className="form-group"><label style={{fontSize:"0.8rem"}}>Кто платил</label><select value={payerId} onChange={(e)=>setPayerId(e.target.value)} style={{padding:"8px", fontSize:"0.9rem"}}><option value="">Выберите плательщика</option>{room.participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                </div>
                <div className="form-row" style={{marginTop:"10px", gap:"10px"}}>
                  <div className="form-group"><label style={{fontSize:"0.8rem"}}>Сумма</label><input type="number" value={individualAmount} onChange={(e)=>setIndividualAmount(e.target.value)} placeholder="0.00" step="0.01" min="0" style={{padding:"8px", fontSize:"0.9rem"}} /></div>
                  <button className="btn-primary" onClick={addToParticipant} style={{padding:"8px 14px", fontSize:"0.9rem", alignSelf:"flex-end"}}>Добавить</button>
                </div>
                <div className="form-group" style={{marginTop:"10px"}}><label style={{fontSize:"0.8rem"}}>Примечание</label><input type="text" value={individualNote} onChange={(e)=>setIndividualNote(e.target.value)} placeholder="Например: За пиццу, такси" onKeyDown={(e)=>e.key==="Enter" && addToParticipant()} style={{padding:"8px", fontSize:"0.9rem"}} /></div>
              </div>

              <div className="card" style={{padding:"16px"}}>
                <h2 style={{fontSize:"1.1rem", marginBottom:"12px"}}>Раскидать сумму между участниками</h2>
                <div className="form-row" style={{gap:"10px"}}>
                  <div className="form-group"><label style={{fontSize:"0.8rem"}}>Сумма для распределения</label><input type="number" value={sharedAmount} onChange={(e)=>setSharedAmount(e.target.value)} placeholder="0.00" step="0.01" min="0" style={{padding:"8px", fontSize:"0.9rem"}} /></div>
                  <div className="form-group"><label style={{fontSize:"0.8rem"}}>Кто платил</label><select value={sharedPayerId} onChange={(e)=>setSharedPayerId(e.target.value)} style={{padding:"8px", fontSize:"0.9rem"}}><option value="">Выберите плательщика</option>{room.participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                </div>
                <div className="form-group" style={{marginTop:"10px"}}><label style={{fontSize:"0.8rem"}}>Примечание</label><input type="text" value={sharedNote} onChange={(e)=>setSharedNote(e.target.value)} placeholder="Например: Общий чек" onKeyDown={(e)=>e.key==="Enter" && distributeShared()} style={{padding:"8px", fontSize:"0.9rem"}} /></div>
                <div style={{marginBottom:"10px", marginTop:"10px", display:"flex", gap:"6px"}}>
                  <button className="btn-secondary btn-small" onClick={selectAll} style={{padding:"6px 10px", fontSize:"0.8rem"}}>Выбрать всех</button>
                  <button className="btn-secondary btn-small" onClick={deselectAll} style={{padding:"6px 10px", fontSize:"0.8rem"}}>Снять всех</button>
                </div>
                <div className="checkbox-grid" style={{gap:"6px"}}>
                  {room.participants.map(p=>(
                    <label key={p.id} className="checkbox-item" style={{padding:"6px 10px", fontSize:"0.9rem"}}><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={()=>toggleSelectedId(p.id)} className="mr-2"/><span>{p.name}</span></label>
                  ))}
                </div>
                {sharedPreview && (
                  <div className="preview-box" style={{marginTop:"10px", padding:"10px"}}>
                    <div className="preview-title" style={{fontSize:"0.85rem", marginBottom:"6px"}}>Предпросмотр распределения:</div>
                    {sharedPreview.map((item, idx)=><div key={idx} className="preview-row" style={{fontSize:"0.85rem", padding:"3px 0"}}><span>{item.name}</span><span>+{item.amount.toFixed(2)} ₽</span></div>)}
                  </div>
                )}
                <button className="btn-primary" style={{marginTop:"10px", padding:"10px", fontSize:"0.9rem"}} onClick={distributeShared} disabled={selectedIds.length===0}>Распределить поровну ({selectedIds.length} чел.)</button>
              </div>
            </>
          )}

          {/* БЛОК ИТОГО */}
          {room && room.participants.length > 0 && (
            <div className="card" style={{padding:"16px"}}>
              <h2 style={{fontSize:"1.1rem", marginBottom:"10px"}}>Итого: потрачено на участников</h2>
              <p style={{fontSize:"0.8rem", color:"var(--text-muted)", marginBottom:"10px"}}>
                Сумма всех долей, начисленных на каждого участника (независимо от того, кто платил).
              </p>
              {room.participants.map(p => {
                const cons = finances.consumed[p.id] || 0;
                return (
                  <div key={p.id} className="total-row" style={{padding:"8px 0", fontSize:"0.9rem"}}>
                    <span>{p.name}</span>
                    <span style={{fontWeight:600}}>{fmt(cons)}</span>
                  </div>
                );
              })}
              <div className="total-row" style={{marginTop:"6px", paddingTop:"10px", borderTop:"2px solid var(--border-color)", fontSize:"0.95rem"}}>
                <span style={{fontWeight:700}}>Общий расход</span>
                <span style={{fontWeight:700}}>{fmt(Object.values(finances.consumed).reduce((a,b)=>a+b, 0))}</span>
              </div>
            </div>
          )}

          {/* ИСТОРИЯ */}
          <div className="card" style={{padding:"16px"}}>
            <h2 style={{fontSize:"1.1rem", marginBottom:"12px", display:"flex", alignItems:"center", gap:"6px"}}>
              <IconHistory className="w-5 h-5"/> История операций
            </h2>
            {(!room || room.events.length===0) ? (
              <div className="empty-state" style={{padding:"24px 16px"}}>
                <IconHistory className="w-8 h-8 mx-auto mb-2 text-muted"/>
                <div className="empty-title" style={{fontSize:"1rem"}}>Пока нет операций</div>
                <div className="empty-subtitle" style={{fontSize:"0.85rem"}}>Начислите или распределите сумму — записи появятся здесь</div>
              </div>
            ) : (
              <div className="logs-modern" style={{gap:"10px"}}>
                {room.events.map(log=>{
                  const { main, comment } = parseDescription(log.description || "");
                  const dateStr = formatDate(log.createdAt);
                  return (
                    <div key={log.id} className={`log-card ${log.type} ${log.isReverted?"reverted":""}`} style={{padding:"12px"}}>
                      <div className="log-card-header" style={{marginBottom:"8px"}}>
                        <div className="log-card-meta" style={{gap:"8px"}}>
                          <span className={`log-badge ${log.type}`} style={{fontSize:"0.65rem", padding:"2px 8px"}}>{log.type==="individual"?"Индивидуальная":"Групповая"}</span>
                          <span className="log-date" style={{fontSize:"0.8rem", fontWeight:500, color:"var(--text-secondary)"}}>
                            {dateStr}{log.isReverted && <span className="reverted-label" style={{color:"var(--accent-danger)", marginLeft:"4px"}}> · Отменено</span>}
                          </span>
                        </div>
                        {isUnlocked && !log.isReverted && (
                          <button className="btn-secondary btn-small" onClick={()=>handleRollback(log.id)} style={{padding:"4px 10px", fontSize:"0.8rem", display:"flex", alignItems:"center", gap:"4px"}}>
                            <IconRollback className="w-3.5 h-3.5"/> Откатить
                          </button>
                        )}
                      </div>
                      <div className="log-card-body" style={{marginBottom:"8px"}}>
                        <div className="log-title" style={{fontSize:"0.9rem", fontWeight:600, marginBottom:"4px"}}>{main}</div>
                        {log.payer?.name && <div className="log-payer" style={{fontSize:"0.8rem", color:"var(--text-secondary)"}}><span className="log-label">Оплатил:</span> {log.payer.name}</div>}
                        {comment && <div className="log-note-modern" style={{fontSize:"0.8rem", color:"var(--text-secondary)", marginTop:"2px"}}><span className="log-label">Комментарий:</span> {comment}</div>}
                      </div>
                      {log.entries && log.entries.length>0 && (
                        <div className="log-entries-modern" style={{paddingTop:"8px"}}>
                          {log.entries.map((entry, idx)=>{
                            const name = room.participants.find(pp=>pp.id===entry.participantId)?.name || "Удалённый";
                            return <div key={idx} className="log-entry-row" style={{fontSize:"0.85rem", padding:"2px 0"}}><span className="entry-name">{name}</span><span className="entry-amount">+{fmt(entry.amount)}</span></div>;
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}