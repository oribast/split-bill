"use client";
import { IconLink, IconUsers, IconLock, IconSun, IconMoon } from "@/components/Icons";
import { useTheme } from "@/hooks/use-theme";
import toast from "react-hot-toast";

interface Props {
  roomId: string;
  inviteCode: string;
  adminLink: string | null;
  hasPassword: boolean;
  onOpenRoom: () => void;
}

export default function CreatedRoomScreen({ roomId, inviteCode, adminLink, hasPassword, onOpenRoom }: Props) {
  const { theme, toggleTheme, mounted } = useTheme();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink = `${origin}/?code=${inviteCode}`;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} скопирован`));
  };

  return (
    <div className="container relative" style={{ textAlign: 'center', paddingTop: '80px' }}>
      {mounted && (
        <button 
          onClick={toggleTheme} 
          className="absolute top-4 right-4 p-2 rounded-lg border bg-card hover:bg-secondary transition"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
          title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
        >
          {theme === 'light' ? <IconMoon className="w-5 h-5" /> : <IconSun className="w-5 h-5" />}
        </button>
      )}

      <h1 style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: 700 }}>Комната создана!</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Отправьте ссылку или код приглашения участникам.
      </p>
      <div className="card" style={{ maxWidth: '480px', margin: '0 auto 24px', padding: '20px' }}>
        {/* Код приглашения */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Код приглашения</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <span style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '2px', flex: 1, color: 'var(--text-primary)' }}>{inviteCode}</span>
            <button onClick={() => copy(inviteCode, "Код")} className="btn-secondary btn-small flex items-center gap-1">
              <IconLink className="w-4 h-4" /> Копировать
            </button>
          </div>
        </div>

        {/* Ссылка для участников */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Ссылка для входа</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px', wordBreak: 'break-all' }}>
            <IconUsers className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', flex: 1, color: 'var(--text-primary)' }}>{inviteLink}</span>
          </div>
        </div>

        {/* ✅ Ссылка администратора показывается ТОЛЬКО если комната защищена паролем */}
        {hasPassword && adminLink && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Прямая ссылка (с ключом админа)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px', wordBreak: 'break-all' }}>
              <IconLock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent-danger)' }} />
              <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', flex: 1, color: 'var(--text-primary)' }}>{adminLink}</span>
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => copy(inviteLink, "Ссылка для участников")}>
            <IconLink className="w-4 h-4 inline mr-1" /> Копировать ссылку
          </button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={onOpenRoom}>
            Открыть комнату
          </button>
        </div>
      </div>
    </div>
  );
}