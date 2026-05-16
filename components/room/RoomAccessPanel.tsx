"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { IconLink, IconKey, IconUsers } from "@/components/Icons";

interface Props {
  roomId: string;
  inviteCode: string;
  isAdmin: boolean; // ✅ Реактивный проп
}

export default function RoomAccessPanel({ roomId, inviteCode, isAdmin }: Props) {
  const [showAdminLink, setShowAdminLink] = useState(false);

  const editKey = typeof window !== "undefined" ? localStorage.getItem(`editKey_${roomId}`) : null;
  const adminLink = editKey ? `${window.location.origin}/room/${roomId}?editKey=${editKey}` : null;
  const joinLink = `${window.location.origin}?code=${inviteCode}`;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} скопирован`));
  };

  // ✅ CSS-переменные автоматически обновляются при смене data-theme на <html>
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', background: 'var(--bg-secondary)', marginBottom: '16px', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>
        <IconKey className="w-4 h-4" /> Доступ и ссылки
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-input)', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconUsers className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: '1px', fontSize: '0.9rem' }}>{inviteCode}</span>
        </div>
        <button onClick={() => copy(inviteCode, "Код")} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}>
          <IconLink className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={() => copy(joinLink, "Ссылка для входа")}
        style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
      >
        <IconLink className="w-4 h-4" /> Копировать ссылку для участников
      </button>

      {/* ✅ Появляется динамически при isAdmin=true */}
      {isAdmin && adminLink && (
        <>
          <button
            onClick={() => setShowAdminLink(!showAdminLink)}
            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--accent-danger, #dc2626)', marginBottom: '8px' }}
          >
            {showAdminLink ? "Скрыть ссылку администратора" : "Показать ссылку администратора"}
          </button>
          {showAdminLink && (
            <div style={{ padding: '8px 10px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border)', wordBreak: 'break-all', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
              {adminLink}
            </div>
          )}
        </>
      )}

      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
        Код приглашения — для входа участников. Пароль или ссылка администратора — для полного управления.
      </p>
    </div>
  );
}