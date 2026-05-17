"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { IconPlus } from "@/components/Icons";

interface Props {
  roomId: string;
  participants: { id: string; name: string }[];
  isUnlocked: boolean;
  onMutate: () => void;
}

export default function DepositForm({ roomId, participants, isUnlocked, onMutate }: Props) {
  const [participantId, setParticipantId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isAdvance, setIsAdvance] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!participantId || !amount) return toast.error("Выберите участника и сумму");
    const cents = Math.round(parseFloat(amount) * 100);
    if (isNaN(cents) || cents <= 0) return toast.error("Введите корректную сумму");

    setSaving(true);
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      const ek = typeof window !== "undefined" ? localStorage.getItem(`editKey_${roomId}`) : null;
      const pw = typeof window !== "undefined" ? localStorage.getItem(`password_${roomId}`) : null;
      if (ek) headers["x-edit-key"] = ek;
      if (pw) headers["Authorization"] = `Basic ${pw}`;

      const res = await fetch(`/api/v1/rooms/${roomId}/deposits`, {
        method: "POST",
        headers,
        body: JSON.stringify({ participantId, amount: cents, isAdvance, note: note.trim() || undefined })
      });

      if (!res.ok) throw new Error("Ошибка");
      toast.success("Взнос добавлен");
      setAmount(""); setNote(""); setParticipantId(""); setIsAdvance(false);
      onMutate();
    } catch {
      toast.error("Ошибка добавления взноса");
    } finally {
      setSaving(false);
    }
  };

  if (!isUnlocked) return null;

  return (
    <div className="card" style={{ padding: '16px' }}>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Внести взнос</h2>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <select 
          value={participantId} 
          onChange={e => setParticipantId(e.target.value)} 
          style={{ flex: '1 1 120px', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
        >
          <option value="">Участник</option>
          {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input 
          type="number" 
          value={amount} 
          onChange={e => setAmount(e.target.value)} 
          placeholder="Сумма ₽" 
          step="0.01" 
          min="0" 
          style={{ flex: '1 1 100px', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} 
        />
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
        <input 
          type="text" 
          value={note} 
          onChange={e => setNote(e.target.value)} 
          placeholder="Примечание (необязательно)" 
          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} 
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={isAdvance} onChange={e => setIsAdvance(e.target.checked)} style={{ accentColor: 'var(--accent-primary)' }} />
          Аванс
        </label>
      </div>
      <button 
        className="btn-primary" 
        onClick={handleSubmit} 
        disabled={saving} 
        style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
      >
        <IconPlus className="w-4 h-4" /> {saving ? 'Сохранение...' : 'Внести взнос'}
      </button>
    </div>
  );
}