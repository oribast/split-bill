"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { calculateBalances } from "@/lib/calculations";

export default function RoomClient({ initialData, roomId }: { initialData: any, roomId: string }) {
  const router = useRouter();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isProtected, setIsProtected] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [theme, setTheme] = useState("light");

  const [newName, setNewName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [individualAmount, setIndividualAmount] = useState("");
  const [individualNote, setIndividualNote] = useState("");
  const [payerId, setPayerId] = useState("");

  const [sharedAmount, setSharedAmount] = useState("");
  const [sharedNote, setSharedNote] = useState("");
  const [sharedPayerId, setSharedPayerId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const [showUnlockForm, setShowUnlockForm] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [showUnlockPwd, setShowUnlockPwd] = useState(false);
  const [unlockError, setUnlockError] = useState("");

  const isLocked = isProtected && !isUnlocked;

  const getAuthHeaders = () => {
    if (typeof window === "undefined") return {};
    const editKey = sessionStorage.getItem(`editKey_${roomId}`);
    const pwd = sessionStorage.getItem(`password_${roomId}`);
    const headers: any = { "Content-Type": "application/json" };
    if (editKey) headers["x-edit-key"] = editKey;
    if (pwd) headers["Authorization"] = `Basic ${pwd}`;
    return headers;
  };

  const handleFetchError = async (res: Response) => {
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== "undefined") sessionStorage.removeItem(`password_${roomId}`);
      setIsUnlocked(false);
      setShowUnlockForm(true);
      setUnlockError("Неверный пароль или доступ запрещён");
      return true;
    }
    return false;
  };

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}`, { headers: getAuthHeaders() });
      if (res.status === 404) { setError("Комната не найдена"); setLoading(false); return; }
      if (await handleFetchError(res)) { setLoading(false); return; }
      
      const data = await res.json();
      const room = data.room;
      
      // Маппинг участников + расчет баланса
      const balances = calculateBalances(room.participants, room.events);
      const partsWithBalance = room.participants.map((p: any) => ({
        ...p,
        amount: (balances[p.id] || 0) / 100
      }));
      setParticipants(partsWithBalance);
      
      setIsProtected(!!room.passwordHash);
      if (room.passwordHash && typeof window !== "undefined") {
        const saved = sessionStorage.getItem(`password_${roomId}`);
        setIsUnlocked(!!saved);
        if (!saved) setShowUnlockForm(true);
      } else {
        setIsUnlocked(true);
        setShowUnlockForm(false);
      }
      
      // Маппинг логов
      const mappedLogs = room.events.map((ev: any) => ({
        id: ev.id,
        type: ev.type,
        description: ev.description,
        note: ev.description.includes('(') ? ev.description.split('(')[1].replace(')', '') : '',
        payer_name: ev.payer?.name,
        is_reverted: ev.isReverted,
        created_at: ev.createdAt,
        entries: ev.entries.map((e: any) => ({
          participant_id: e.participantId,
          delta: (e.amount / 100).toFixed(2)
        }))
      }));
      setLogs(mappedLogs);
      setError("");
    } catch { setError("Ошибка загрузки данных"); }
    finally { setLoading(false); }
  }, [roomId]);

  useEffect(() => { if (roomId) fetchRoom(); }, [roomId, fetchRoom]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const current = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  const tryUnlock = async () => {
    if (!unlockPassword.trim()) return;
    setSaving(true);
    setUnlockError("");
    try {
      const authHeader = `Basic ${btoa(`admin:${unlockPassword.trim()}`)}`;
      const res = await fetch(`/api/v1/rooms/${roomId}`, { headers: { Authorization: authHeader } });
      if (res.ok) {
        if (typeof window !== "undefined") sessionStorage.setItem(`password_${roomId}`, btoa(unlockPassword.trim()));
        setIsUnlocked(true);
        setShowUnlockForm(false);
        setUnlockPassword("");
        setShowUnlockPwd(false);
        fetchRoom();
      } else {
        setUnlockError("Неверный пароль");
      }
    } catch { setUnlockError("Ошибка сети"); }
    finally { setSaving(false); }
  };

  const lockRoom = () => {
    if (window.confirm("Заблокировать редактирование?")) {
      if (typeof window !== "undefined") sessionStorage.removeItem(`password_${roomId}`);
      setIsUnlocked(false);
      setShowUnlockForm(true);
      setUnlockPassword("");
      setUnlockError("");
    }
  };

  const addParticipant = async () => {
    if (isLocked) return alert("Комната защищена паролем.");
    const name = newName.trim() || `Участник ${participants.length + 1}`;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}/participants`, {
        method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ name })
      });
      if (await handleFetchError(res)) return;
      if (res.ok) {
        const data = await res.json();
        setParticipants(prev => [...prev, { id: data.participant.id, name: data.participant.name, amount: 0 }]);
        setNewName("");
        fetchRoom();
      } else alert("Ошибка добавления");
    } catch { alert("Ошибка сети"); }
    finally { setSaving(false); }
  };

  const removeParticipant = async (pid: string) => {
    if (isLocked) return alert("Комната защищена паролем.");
    const p = participants.find(x => x.id === pid);
    if (!window.confirm(`Удалить ${p?.name || "участника"}?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}/participants/${pid}`, { method: "DELETE", headers: getAuthHeaders() });
      if (await handleFetchError(res)) return;
      if (res.ok) {
        setParticipants(prev => prev.filter(p => p.id !== pid));
        setSelectedIds(prev => prev.filter(sid => sid !== pid));
        if (selectedId === pid) setSelectedId("");
        if (payerId === pid) setPayerId("");
        if (sharedPayerId === pid) setSharedPayerId("");
        fetchRoom();
      } else alert("Ошибка удаления");
    } catch { alert("Ошибка удаления"); }
    finally { setSaving(false); }
  };

  const updateName = (pid: string, name: string) => {
    setParticipants(prev => prev.map(p => p.id === pid ? { ...p, name } : p));
  };

  const saveName = async (pid: string, name: string) => {
    if (isLocked) return;
    try {
      await fetch(`/api/v1/rooms/${roomId}/participants/${pid}`, {
        method: "PUT", headers: getAuthHeaders(), body: JSON.stringify({ name })
      });
    } catch { /* ignore */ }
  };

  const addToParticipant = async () => {
    if (isLocked) return alert("Комната защищена паролем.");
    if (!selectedId || !individualAmount || !payerId) return alert("Заполните поля");
    const amount = parseFloat(individualAmount);
    if (isNaN(amount) || amount <= 0) return alert("Некорректная сумма");
    
    setSaving(true);
    try {
      const desc = `Начислено ${amount.toFixed(2)} ₽ участнику ${participants.find(x => x.id === selectedId)?.name || ""} ${individualNote ? `(${individualNote})` : ''}`;
      const res = await fetch(`/api/v1/rooms/${roomId}/expenses/individual`, {
        method: "POST", headers: { ...getAuthHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ description: desc, amount: Math.round(amount * 100), payerId, targetParticipantId: selectedId })
      });
      if (await handleFetchError(res)) return;
      if (res.ok) {
        setIndividualAmount(""); setIndividualNote(""); setSelectedId(""); setPayerId("");
        fetchRoom();
      } else alert("Ошибка начисления");
    } catch { alert("Ошибка сети"); }
    finally { setSaving(false); }
  };

  const distributeShared = async () => {
    if (isLocked) return alert("Комната защищена паролем.");
    if (!sharedAmount || selectedIds.length === 0 || !sharedPayerId) return alert("Заполните поля");
    const amount = parseFloat(sharedAmount);
    if (isNaN(amount) || amount <= 0) return alert("Некорректная сумма");

    setSaving(true);
    try {
      const names = participants.filter(p => selectedIds.includes(p.id)).map(p => p.name).join(", ");
      const desc = `Распределено ${amount.toFixed(2)} ₽ (${selectedIds.length} чел.: ${names}) ${sharedNote ? `(${sharedNote})` : ''}`;
      const res = await fetch(`/api/v1/rooms/${roomId}/expenses/shared`, {
        method: "POST", headers: { ...getAuthHeaders(), "X-Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ description: desc, amount: Math.round(amount * 100), payerId: sharedPayerId, participantIds: selectedIds })
      });
      if (await handleFetchError(res)) return;
      if (res.ok) {
        setSharedAmount(""); setSharedNote(""); setSharedPayerId(""); setSelectedIds([]);
        fetchRoom();
      } else alert("Ошибка распределения");
    } catch { alert("Ошибка сети"); }
    finally { setSaving(false); }
  };

  const toggleSelectedId = (pid: string) => {
    setSelectedIds(prev => prev.includes(pid) ? prev.filter(i => i !== pid) : [...prev, pid]);
  };
  const selectAll = () => setSelectedIds(participants.map(p => p.id));
  const deselectAll = () => setSelectedIds([]);

  const handleRollback = async (eventId: string) => {
    if (isLocked) return alert("Комната защищена паролем.");
    if (!window.confirm("Откатить эту операцию?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}/events/${eventId}`, { method: "POST", headers: getAuthHeaders() });
      if (await handleFetchError(res)) return;
      if (res.ok) { fetchRoom(); } else alert("Не удалось откатить");
    } catch { alert("Ошибка сети"); }
    finally { setSaving(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => alert("Ссылка скопирована!")).catch(() => alert("Не удалось скопировать"));
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
      const p = participants.find(x => x.id === pid);
      return { name: p?.name || "Удалённый", amount: addCents / 100 };
    });
  })();

  const total = participants.reduce((sum, p) => sum + (p.amount || 0), 0);

  if (loading) return <div className="container" style={{textAlign:'center', paddingTop:'80px'}}><h1>Загрузка...</h1></div>;
  if (error) return (
    <div className="container" style={{textAlign:'center', paddingTop:'80px'}}>
      <h1>Ошибка</h1>
      <p style={{color:'var(--text-secondary)', marginBottom:'24px'}}>{error}</p>
      <button className="btn-primary" onClick={() => router.push("/")}>На главную</button>
    </div>
  );

  return (
    <div className="container">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px", flexWrap:"wrap", gap:"8px"}}>
        <h1>Комната: {roomId}</h1>
        <div style={{display:"flex", alignItems:"center", gap:"8px"}}>
          {saving && <span style={{color:"var(--text-muted)", fontSize:"0.875rem"}}>Сохранение...</span>}
          <button className="theme-toggle btn-small" onClick={toggleTheme} title={theme==="light"?"Тёмная тема":"Светлая тема"}>
            {theme==="light"?"🌙":"☀️"}
          </button>
          {isProtected && (
            isUnlocked ? (
              <button className="btn-small btn-secondary" onClick={lockRoom} style={{display:"flex", alignItems:"center", gap:"6px"}}>🔓 Открыто</button>
            ) : (
              <button className="btn-small btn-secondary" onClick={()=>setShowUnlockForm(!showUnlockForm)} style={{display:"flex", alignItems:"center", gap:"6px"}}>🔒 Заблокировано</button>
            )
          )}
          <button className="btn-secondary btn-small" onClick={copyLink} style={{display:"flex", alignItems:"center", gap:"6px"}}>📋 Ссылка</button>
        </div>
      </div>

      {isProtected && !isUnlocked && showUnlockForm && (
        <div className="card unlock-card">
          <h3 className="unlock-title">🔒 Введите пароль комнаты</h3>
          <div style={{display:"flex", gap:"12px", alignItems:"flex-start", flexWrap:"wrap"}}>
            <div className="password-field" style={{flex:1, minWidth:"200px"}}>
              <span className="icon">🔒</span>
              <input type={showUnlockPwd?"text":"password"} value={unlockPassword} onChange={(e)=>{setUnlockPassword(e.target.value); setUnlockError("");}} placeholder="Пароль" onKeyDown={(e)=>e.key==="Enter" && tryUnlock()} autoFocus />
              <button type="button" className="password-toggle" onClick={()=>setShowUnlockPwd(!showUnlockPwd)} title={showUnlockPwd?"Скрыть":"Показать"}>
                {showUnlockPwd?"🙈":"👁️"}
              </button>
            </div>
            <button className="btn-primary" onClick={tryUnlock}>Разблокировать</button>
          </div>
          {unlockError && <p style={{color:"#e53e3e", fontSize:"0.875rem", marginTop:"8px"}}>{unlockError}</p>}
        </div>
      )}

      <div className="card">
        <h2>Участники</h2>
        {!isLocked && (
          <div className="form-row" style={{marginBottom:"16px"}}>
            <div className="form-group">
              <label>Имя</label>
              <input type="text" value={newName} onChange={(e)=>setNewName(e.target.value)} placeholder="Например, Алексей" onKeyDown={(e)=>e.key==="Enter" && addParticipant()} autoFocus={participants.length===0} />
            </div>
            <button className="btn-primary" onClick={addParticipant}>Добавить</button>
          </div>
        )}
        {participants.length===0 ? (
          <div className="empty-state"><div className="empty-icon">👥</div><div className="empty-title">Пока нет участников</div><div className="empty-subtitle">Добавьте первого, чтобы начать делить счёт</div></div>
        ) : (
          <div className="participants-list">
            {participants.map(p=>(
              <div key={p.id} className="participant-item">
                {isLocked ? <span style={{flex:1, fontWeight:500}}>{p.name}</span> : (
                  <input type="text" value={p.name} onChange={(e)=>updateName(p.id, e.target.value)} onBlur={(e)=>saveName(p.id, e.target.value)} />
                )}
                <span className="participant-amount">{p.amount.toFixed(2)} ₽</span>
                {!isLocked && <button className="btn-secondary btn-small" onClick={()=>removeParticipant(p.id)}>Удалить</button>}
              </div>
            ))}
          </div>
        )}
      </div>

      {!isLocked && participants.length>0 && (
        <>
          <div className="card">
            <h2>Накинуть сумму конкретному человеку</h2>
            <div className="form-row">
              <div className="form-group"><label>Кому</label><select value={selectedId} onChange={(e)=>setSelectedId(e.target.value)}><option value="">Выберите участника</option>{participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="form-group"><label>Кто платил</label><select value={payerId} onChange={(e)=>setPayerId(e.target.value)}><option value="">Выберите плательщика</option>{participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            </div>
            <div className="form-row" style={{marginTop:"12px"}}>
              <div className="form-group"><label>Сумма</label><input type="number" value={individualAmount} onChange={(e)=>setIndividualAmount(e.target.value)} placeholder="0.00" step="0.01" min="0" /></div>
              <button className="btn-primary" onClick={addToParticipant}>Добавить</button>
            </div>
            <div className="form-group" style={{marginTop:"12px"}}><label>Примечание</label><input type="text" value={individualNote} onChange={(e)=>setIndividualNote(e.target.value)} placeholder="Например: За пиццу, такси" onKeyDown={(e)=>e.key==="Enter" && addToParticipant()} /></div>
          </div>

          <div className="card">
            <h2>Раскидать сумму между участниками</h2>
            <div className="form-row">
              <div className="form-group"><label>Сумма для распределения</label><input type="number" value={sharedAmount} onChange={(e)=>setSharedAmount(e.target.value)} placeholder="0.00" step="0.01" min="0" /></div>
              <div className="form-group"><label>Кто платил</label><select value={sharedPayerId} onChange={(e)=>setSharedPayerId(e.target.value)}><option value="">Выберите плательщика</option>{participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            </div>
            <div className="form-group" style={{marginTop:"12px"}}><label>Примечание</label><input type="text" value={sharedNote} onChange={(e)=>setSharedNote(e.target.value)} placeholder="Например: Общий чек" onKeyDown={(e)=>e.key==="Enter" && distributeShared()} /></div>
            <div style={{marginBottom:"12px", marginTop:"12px", display:"flex", gap:"8px"}}>
              <button className="btn-secondary btn-small" onClick={selectAll}>Выбрать всех</button>
              <button className="btn-secondary btn-small" onClick={deselectAll}>Снять всех</button>
            </div>
            <div className="checkbox-grid">
              {participants.map(p=>(
                <label key={p.id} className="checkbox-item"><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={()=>toggleSelectedId(p.id)} /><span>{p.name}</span></label>
              ))}
            </div>
            {sharedPreview && (
              <div className="preview-box">
                <div className="preview-title">Предпросмотр распределения:</div>
                {sharedPreview.map((item, idx)=><div key={idx} className="preview-row"><span>{item.name}</span><span>+{item.amount.toFixed(2)} ₽</span></div>)}
              </div>
            )}
            <button className="btn-primary" style={{marginTop:"12px"}} onClick={distributeShared} disabled={selectedIds.length===0}>Распределить поровну ({selectedIds.length} чел.)</button>
          </div>
        </>
      )}

      {participants.length>0 && (
        <div className="card">
          <h2>Итого</h2>
          {participants.map(p=><div key={p.id} className="total-row"><span>{p.name}</span><span>{p.amount.toFixed(2)} ₽</span></div>)}
          <div className="total-row"><span>Общая сумма</span><span>{total.toFixed(2)} ₽</span></div>
        </div>
      )}

      <div className="card">
        <h2>История операций</h2>
        {logs.length===0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">Пока нет операций</div><div className="empty-subtitle">Начислите или распределите сумму — записи появятся здесь</div></div>
        ) : (
          <div className="logs-modern">
            {logs.map(log=>{
              const date = new Date(log.created_at);
              const dateStr = date.toLocaleDateString("ru-RU", {day:"numeric", month:"short", year:"numeric"});
              const timeStr = date.toLocaleTimeString("ru-RU", {hour:"2-digit", minute:"2-digit"});
              return (
                <div key={log.id} className={`log-card ${log.type} ${log.is_reverted?"reverted":""}`}>
                  <div className="log-card-header">
                    <div className="log-card-meta">
                      <span className={`log-badge ${log.type}`}>{log.type==="individual"?"Индивидуальная":"Групповая"}</span>
                      <span className="log-date">{dateStr} · {timeStr}{log.is_reverted && <span className="reverted-label"> · Отменено</span>}</span>
                    </div>
                    {!isLocked && !log.is_reverted && <button className="btn-secondary btn-small" onClick={()=>handleRollback(log.id)}>Откатить</button>}
                  </div>
                  <div className="log-card-body">
                    <div className="log-title">{log.description}</div>
                    {log.payer_name && <div className="log-payer"><span className="log-label">Оплатил:</span> {log.payer_name}</div>}
                    {log.note && <div className="log-note-modern"><span className="log-label">Комментарий:</span> {log.note}</div>}
                  </div>
                  {log.entries && log.entries.length>0 && (
                    <div className="log-entries-modern">
                      {log.entries.map((entry:any, idx:number)=>{
                        const name = participants.find(pp=>pp.id===entry.participant_id)?.name || "Удалённый";
                        return <div key={idx} className="log-entry-row"><span className="entry-name">{name}</span><span className="entry-amount">+{entry.delta} ₽</span></div>;
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}