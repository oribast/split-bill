"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { IconLink, IconKey, IconUsers } from "@/components/Icons";

interface Props {
  roomId: string;
  inviteCode: string;
  isAdmin: boolean;
}

export default function RoomAccessPanel({ roomId, inviteCode, isAdmin }: Props) {
  const [showAdminLink, setShowAdminLink] = useState(false);

  const editKey = typeof window !== "undefined" ? localStorage.getItem(`editKey_${roomId}`) : null;
  const pwdHash = typeof window !== "undefined" ? localStorage.getItem(`password_${roomId}`) : null;

  let adminLink = null;
  if (editKey) adminLink = `${window.location.origin}/room/${roomId}?editKey=${editKey}`;
  else if (pwdHash) adminLink = `${window.location.origin}/room/${roomId}?pwd=${encodeURIComponent(pwdHash)}`;

  const joinLink = `${window.location.origin}?code=${inviteCode}`;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} скопирован`));
  };

  return (
    <div style={{
      border: '1px solid var(--panel-border)',
      borderRadius: '12px',
      padding: '14px',
      background: 'var(--panel-bg)',
      marginBottom: '16px',
      color: 'var(--text-main)',
      transition: 'all 0.2s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>
        <IconKey className="w-4 h-4" /> Доступ и ссылки
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px', background: 'var(--panel-inner-bg)', borderRadius: '8px',
        marginBottom: '8px', border: '1px solid var(--panel-border)'
      }}>
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
        style={{
          width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '8px',
          border: '1px solid var(--panel-border)', background: 'transparent', cursor: 'pointer',
          fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '6px', transition: 'background 0.2s'
        }}
      >
        <IconLink className="w-4 h-4" /> Копировать ссылку для участников
      </button>

      {isAdmin && adminLink && (
        <>
          <button
            onClick={() => setShowAdminLink(!showAdminLink)}
            style={{
              width: '100%', padding: '8px', borderRadius: '8px',
              border: '1px solid var(--panel-border)', background: 'transparent', cursor: 'pointer',
              fontSize: '0.8rem', color: 'var(--accent-danger)', marginBottom: '8px', transition: 'background 0.2s'
            }}
          >
            {showAdminLink ? "Скрыть ссылку администратора" : "Показать ссылку администратора"}
          </button>
          {showAdminLink && (
            <div style={{
              padding: '8px 10px', background: 'var(--panel-inner-bg)', borderRadius: '8px',
              border: '1px solid var(--panel-border)', wordBreak: 'break-all', fontSize: '0.75rem',
              fontFamily: 'monospace', color: 'var(--text-muted)'
            }}>
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