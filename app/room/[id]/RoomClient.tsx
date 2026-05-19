"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import toast from "react-hot-toast";
import { calculateFinances, Finances } from "@/lib/calculations";
import { calculateBalances, BalanceSheet } from "@/lib/balances";
import { RoomWithRelations } from "@/lib/types";
import { useTheme } from '@/hooks/use-theme';

import RoomHeader from "@/components/room/RoomHeader";
import UnlockForm from "@/components/room/UnlockForm";
import ParticipantsSidebar from "@/components/room/ParticipantsSidebar";
import IndividualExpenseForm from "@/components/room/IndividualExpenseForm";
import SharedExpenseForm from "@/components/room/SharedExpenseForm";
import TotalsBlock from "@/components/room/TotalsBlock";
import HistoryBlock from "@/components/room/HistoryBlock";
import BalancesTable from "@/components/room/BalancesTable";
import SettlementsCard from "@/components/room/SettlementsCard";
import DepositForm from "@/components/room/DepositForm";

const fetcher = async (url: string) => {
  const roomId = url.split("/").pop();
  const editKey = typeof window !== "undefined" ? localStorage.getItem(`editKey_${roomId}`) : null;
  const pwd = typeof window !== "undefined" ? localStorage.getItem(`password_${roomId}`) : null;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (editKey) headers["x-edit-key"] = editKey;
  if (pwd) headers["Authorization"] = `Basic ${pwd}`;

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new Error("auth_required");
    throw new Error("fetch_failed");
  }
  const data = await res.json();
  return data.room as RoomWithRelations;
};

export default function RoomClient({ initialData, roomId }: { initialData: RoomWithRelations; roomId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: room, mutate, isLoading, error } = useSWR<RoomWithRelations>(`/api/v1/rooms/${roomId}`, fetcher, {
    fallbackData: initialData,
    revalidateOnFocus: false,
  });

  const { theme, toggleTheme, mounted } = useTheme();
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

  const [balances, setBalances] = useState<Record<string, BalanceSheet>>({});
  const [roomStatus, setRoomStatus] = useState<"open" | "closed">("open");

  // ✅ Синхронизация статуса комнаты из данных
  useEffect(() => {
    if (room?.status) setRoomStatus(room.status as "open" | "closed");
  }, [room]);

  // ✅ 1. Применение ключей/паролей из URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const editKeyFromUrl = url.searchParams.get('editKey');
    const pwdFromUrl = url.searchParams.get('pwd');

    if (editKeyFromUrl) {
      localStorage.setItem(`editKey_${roomId}`, editKeyFromUrl);
      url.searchParams.delete('editKey');
      window.history.replaceState({}, '', url.toString());
      toast.success('Ключ администратора применён');
      mutate();
    } else if (pwdFromUrl) {
      localStorage.setItem(`password_${roomId}`, decodeURIComponent(pwdFromUrl));
      url.searchParams.delete('pwd');
      window.history.replaceState({}, '', url.toString());
      toast.success('Пароль применён. Права администратора активны.');
      mutate();
    }
  }, [roomId, mutate]);

  // ✅ 2. Восстановление сессии при загрузке/перезагрузке
  useEffect(() => {
    if (typeof window === "undefined" || !room) return;
    const hasEditKey = !!localStorage.getItem(`editKey_${roomId}`);
    const hasPwd = !!localStorage.getItem(`password_${roomId}`);
    const roomProtected = !!room.passwordHash;

    setIsProtected(roomProtected);

    if (roomProtected) {
      if (hasEditKey || hasPwd) {
        setIsUnlocked(true);
        setShowUnlockForm(false);
      } else {
        setIsUnlocked(false);
        setShowUnlockForm(true);
      }
    } else {
      setIsUnlocked(true);
      setShowUnlockForm(false);
    }
  }, [room, roomId]);

  // ✅ 3. Расчёт балансов при обновлении данных комнаты
  useEffect(() => {
    if (!room) return;
    setBalances(calculateBalances(room.participants, room.events, room.deposits || []));
  }, [room]);

  const getHeaders = () => {
    const h: HeadersInit = { "Content-Type": "application/json" };
    const ek = localStorage.getItem(`editKey_${roomId}`);
    const pw = localStorage.getItem(`password_${roomId}`);
    if (ek) h["x-edit-key"] = ek;
    if (pw) h["Authorization"] = `Basic ${pw}`;
    return h;
  };

  const handleFetchError = (res: Response) => {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem(`password_${roomId}`);
      localStorage.removeItem(`editKey_${roomId}`);
      setIsUnlocked(false); setShowUnlockForm(true);
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
      const authString = btoa(`admin:${unlockPassword.trim()}`);
      const res = await fetch(`/api/v1/rooms/${roomId}`, { headers: { Authorization: `Basic ${authString}` } });
      
      if (res.ok) {
        localStorage.setItem(`password_${roomId}`, authString);
        setIsUnlocked(true); setShowUnlockForm(false); setUnlockPassword(""); setShowUnlockPwd(false);
        toast.success("Комната разблокирована. Вам доступны права администратора.");
        mutate();
      } else if (res.status === 401 || res.status === 403) {
        setUnlockError("Неверный пароль");
        toast.error("Неверный пароль");
      } else {
        throw new Error("network");
      }
    } catch {
      setUnlockError("Ошибка сети");
      toast.error("Ошибка сети");
    } finally { setSaving(false); }
  };

  const lockRoom = () => {
    if (window.confirm("Заблокировать редактирование?")) {
      localStorage.removeItem(`password_${roomId}`);
      localStorage.removeItem(`editKey_${roomId}`);
      setIsUnlocked(false); setShowUnlockForm(true); setUnlockPassword(""); setUnlockError("");
      toast("Редактирование заблокировано", { icon: "🔒" });
      mutate();
    }
  };

  // ✅ Управление статусом комнаты (закрытие/открытие)
  const handleToggleStatus = async () => {
    const nextStatus = roomStatus === "open" ? "closed" : "open";
    if (!window.confirm(nextStatus === "closed" ? "Закрыть комнату? Новые операции будут недоступны." : "Открыть комнату для новых операций?")) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error();
      setRoomStatus(nextStatus);
      toast.success(nextStatus === "closed" ? "Комната закрыта" : "Комната открыта");
      mutate();
    } catch { toast.error("Ошибка изменения статуса"); } 
    finally { setSaving(false); }
  };

  // ✅ Очистка истории и взносов
  const handleClearData = async () => {
    if (!window.confirm("⚠️ ВНИМАНИЕ: Это удалит ВСЮ историю расходов и взносов. Участники останутся. Действие необратимо. Продолжить?")) return;
    if (!window.confirm("Вы уверены? Данные нельзя будет восстановить.")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}/clear`, { method: "POST", headers: getHeaders() });
      if (!res.ok) throw new Error();
      toast.success("История и взносы очищены");
      mutate();
    } catch { toast.error("Ошибка очистки данных"); }
    finally { setSaving(false); }
  };

  const addParticipant = async () => {
    if (!isUnlocked) return toast.error("Комната защищена паролем");
    const name = newName.trim() || `Участник ${(room?.participants.length || 0) + 1}`;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}/participants`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ name }) });
      if (handleFetchError(res)) return;
      if (res.ok) { const data = await res.json(); toast.success(`${data.participant.name} добавлен`); setNewName(""); mutate(); }
      else toast.error("Ошибка добавления");
    } catch { toast.error("Ошибка сети"); } finally { setSaving(false); }
  };

  const removeParticipant = async (pid: string) => {
    if (!isUnlocked) return toast.error("Комната защищена паролем");
    const p = room?.participants.find(x => x.id === pid);
    if (!window.confirm(`Удалить ${p?.name || "участника"}? Расходы будут перераспределены.`)) return;
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
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Ошибка удаления");
      }
    } catch { toast.error("Ошибка сети"); } finally { setSaving(false); }
  };

  const updateName = (pid: string, name: string) => mutate(prev => prev ? { ...prev, participants: prev.participants.map(p => p.id === pid ? { ...p, name } : p) } : prev, { revalidate: false });
  const saveName = async (pid: string, name: string) => { if (!isUnlocked) return; try { await fetch(`/api/v1/rooms/${roomId}/participants/${pid}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify({ name }) }); mutate(); } catch { toast.error("Ошибка сохранения имени"); } };

  const addToParticipant = async () => {
    if (!isUnlocked) return toast.error("Комната защищена паролем");
    if (!selectedId || !individualAmount || !payerId) return toast.error("Выберите участника, плательщика и сумму");
    const amount = parseFloat(individualAmount); if (isNaN(amount) || amount <= 0) return toast.error("Введите корректную сумму");
    setSaving(true);
    try {
      const p = room?.participants.find(x => x.id === selectedId);
      const notePart = individualNote.trim() ? ` (${individualNote.trim()})` : "";
      const desc = `Начислено ${amount.toFixed(2)} ₽ участнику ${p?.name || ""}${notePart}`;
      const res = await fetch(`/api/v1/rooms/${roomId}/expenses/individual`, { method: "POST", headers: { ...getHeaders(), "X-Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ description: desc, amount: Math.round(amount * 100), payerId, targetParticipantId: selectedId }) });
      if (handleFetchError(res)) return;
      if (res.ok) { toast.success(`Начислено ${amount.toFixed(2)} ₽`); setIndividualAmount(""); setIndividualNote(""); setSelectedId(""); setPayerId(""); mutate(); }
      else toast.error("Ошибка начисления");
    } catch { toast.error("Ошибка сети"); } finally { setSaving(false); }
  };

  const distributeShared = async () => {
    if (!isUnlocked) return toast.error("Комната защищена паролем");
    if (!sharedAmount || selectedIds.length === 0 || !sharedPayerId) return toast.error("Введите сумму, выберите участников и плательщика");
    const amount = parseFloat(sharedAmount); if (isNaN(amount) || amount <= 0) return toast.error("Введите корректную сумму");
    setSaving(true);
    try {
      const names = room?.participants.filter(p => selectedIds.includes(p.id)).map(p => p.name).join(", ") || "";
      const notePart = sharedNote.trim() ? ` (${sharedNote.trim()})` : "";
      const desc = `Распределено ${amount.toFixed(2)} ₽ (${selectedIds.length} чел.: ${names})${notePart}`;
      const res = await fetch(`/api/v1/rooms/${roomId}/expenses/shared`, { method: "POST", headers: { ...getHeaders(), "X-Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ description: desc, amount: Math.round(amount * 100), payerId: sharedPayerId, participantIds: selectedIds }) });
      if (handleFetchError(res)) return;
      if (res.ok) { toast.success(`Распределено ${amount.toFixed(2)} ₽`); setSharedAmount(""); setSharedNote(""); setSharedPayerId(""); setSelectedIds([]); mutate(); }
      else toast.error("Ошибка распределения");
    } catch { toast.error("Ошибка сети"); } finally { setSaving(false); }
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
      if (res.ok) { toast.success("Операция откачена"); mutate(); } else toast.error("Не удалось откатить");
    } catch { toast.error("Ошибка сети"); } finally { setSaving(false); }
  };

  const copyLink = () => { navigator.clipboard.writeText(window.location.href).then(() => toast.success("Ссылка скопирована!")).catch(() => toast.error("Не удалось скопировать")); };

  const sharedPreview = (() => {
    if (!sharedAmount || selectedIds.length === 0) return null;
    const amount = parseFloat(sharedAmount); if (isNaN(amount) || amount <= 0) return null;
    const totalCents = Math.round(amount * 100); const count = selectedIds.length;
    const baseCents = Math.floor(totalCents / count); let remainderCents = totalCents - baseCents * count;
    return selectedIds.map(pid => {
      let addCents = baseCents; if (remainderCents > 0) { addCents += 1; remainderCents -= 1; }
      const p = room?.participants.find(x => x.id === pid);
      return { name: p?.name || "Удалённый", amount: addCents / 100 };
    });
  })();

  if (isLoading && !room) return <div className="container" style={{textAlign:'center', paddingTop:'80px'}}><h1>Загрузка...</h1></div>;
  if (error?.message === "fetch_failed" && !room) return (
    <div className="container" style={{textAlign:'center', paddingTop:'80px'}}>
      <h1>Ошибка</h1><p style={{color:'var(--text-secondary)', marginBottom:'24px'}}>Комната не найдена или ошибка загрузки</p>
      <button className="btn-primary" onClick={() => router.push("/")}>На главную</button>
    </div>
  );

  const finances: Finances = room ? calculateFinances(room.participants, room.events) : { balances: {}, consumed: {}, paid: {} };

  // ✅ Гидрационная защита темы
  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-6xl px-3 py-5">
      <RoomHeader 
        roomId={roomId} 
        roomName={room?.name || `Комната ${roomId.slice(0, 6)}`}
        inviteCode={room?.inviteCode}
        isAdmin={isUnlocked}
        saving={saving} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        isProtected={isProtected} 
        isUnlocked={isUnlocked} 
        roomStatus={roomStatus}
        lockRoom={lockRoom} 
        setShowUnlockForm={setShowUnlockForm} 
        onToggleStatus={handleToggleStatus}
        onClearData={handleClearData}
      />

      {/* 🔒 Баннер закрытой комнаты */}
      {roomStatus === "closed" && (
        <div style={{
          padding: "10px 14px", marginBottom: "14px", borderRadius: "8px",
          background: "var(--bg-secondary)", border: "1px solid var(--border)",
          color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px"
        }}>
          🔒 Комната закрыта для новых операций. История и балансы доступны для просмотра.
        </div>
      )}

      {isProtected && !isUnlocked && showUnlockForm && (
        <UnlockForm 
          unlockPassword={unlockPassword} 
          setUnlockPassword={setUnlockPassword} 
          showUnlockPwd={showUnlockPwd} 
          setShowUnlockPwd={setShowUnlockPwd} 
          unlockError={unlockError} 
          tryUnlock={tryUnlock} 
        />
      )}

      <div className="flex flex-col lg:flex-row gap-5">
        <ParticipantsSidebar 
          participants={room?.participants || []} 
          isUnlocked={isUnlocked} 
          newName={newName} 
          setNewName={setNewName} 
          addParticipant={addParticipant} 
          updateName={updateName} 
          saveName={saveName} 
          removeParticipant={removeParticipant} 
          finances={finances} 
        />
        
        <main className="flex-1 min-w-0 space-y-5">
          {/* ✅ Формы расходов и депозитов скрываются при закрытой комнате */}
          {isUnlocked && room && room.participants.length > 0 && roomStatus === "open" && (
            <>
              <DepositForm 
                roomId={roomId} 
                participants={room.participants} 
                isUnlocked={isUnlocked} 
                onMutate={mutate} 
              />
              <IndividualExpenseForm 
                participants={room.participants} 
                selectedId={selectedId} 
                setSelectedId={setSelectedId} 
                payerId={payerId} 
                setPayerId={setPayerId} 
                individualAmount={individualAmount} 
                setIndividualAmount={setIndividualAmount} 
                individualNote={individualNote} 
                setIndividualNote={setIndividualNote} 
                addToParticipant={addToParticipant} 
              />
              <SharedExpenseForm 
                participants={room.participants} 
                sharedAmount={sharedAmount} 
                setSharedAmount={setSharedAmount} 
                sharedPayerId={sharedPayerId} 
                setSharedPayerId={setSharedPayerId} 
                sharedNote={sharedNote} 
                setSharedNote={setSharedNote} 
                selectedIds={selectedIds} 
                toggleSelectedId={toggleSelectedId} 
                selectAll={selectAll} 
                deselectAll={deselectAll} 
                sharedPreview={sharedPreview} 
                distributeShared={distributeShared} 
              />
            </>
          )}
          
          {room && room.participants.length > 0 && <TotalsBlock participants={room.participants} finances={finances} />}
          
          {room && room.participants.length > 0 && (
            <>
              <BalancesTable participants={room.participants} balances={balances} />
              <SettlementsCard participants={room.participants} balances={balances} />
            </>
          )}
          
          <HistoryBlock 
            events={room?.events || []} 
            deposits={room?.deposits || []}
            participants={room?.participants || []} 
            isUnlocked={isUnlocked} 
            handleRollback={handleRollback} 
          />
        </main>
      </div>
    </div>
  );
}