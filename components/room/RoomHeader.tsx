"use client";
import { useState, useRef, useEffect } from "react";
import { IconLock, IconUnlock, IconLink, IconSun, IconMoon, IconKey, IconUsers, IconSettings, IconTrash, IconArchive } from "@/components/Icons";
import toast from "react-hot-toast";

interface RoomHeaderProps {
  roomId: string;
  roomName: string;
  inviteCode?: string;
  isAdmin: boolean;
  saving: boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
  isProtected: boolean;
  isUnlocked: boolean;
  roomStatus: "open" | "closed";
  lockRoom: () => void;
  setShowUnlockForm: (v: boolean) => void;
  onToggleStatus: () => void;
  onClearData: () => void;
  onDeleteRoom: () => void; // ✅ Добавлено
}

export default function RoomHeader({
  roomId, roomName, inviteCode, isAdmin, saving, theme, toggleTheme,
  isProtected, isUnlocked, roomStatus, lockRoom, setShowUnlockForm,
  onToggleStatus, onClearData, onDeleteRoom // ✅ Добавлено
}: RoomHeaderProps) {
  const [showAccessMenu, setShowAccessMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const accessRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accessRef.current && !accessRef.current.contains(e.target as Node)) setShowAccessMenu(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setShowSettingsMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} скопирован`));
    setShowAccessMenu(false);
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const editKey = typeof window !== "undefined" ? localStorage.getItem(`editKey_${roomId}`) : null;
  const pwdHash = typeof window !== "undefined" ? localStorage.getItem(`password_${roomId}`) : null;
  let adminLink = null;
  if (editKey) adminLink = `${origin}/room/${roomId}?editKey=${editKey}`;
  else if (pwdHash) adminLink = `${origin}/room/${roomId}?pwd=${encodeURIComponent(pwdHash)}`;
  const inviteLink = inviteCode ? `${origin}/?code=${inviteCode}` : null;

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <h1 style={{ marginBottom: 0, fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
          Tally <span style={{ fontWeight: 400, opacity: 0.6, fontSize: "0.9em" }}>| {roomName}</span>
        </h1>
        
        {/* ⚙️ Шестерёнка настроек (только для админа) */}
        {isAdmin && (
          <div style={{ position: "relative" }} ref={settingsRef}>
            <button 
              className="btn-secondary btn-small" 
              onClick={() => setShowSettingsMenu(!showSettingsMenu)} 
              style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 8px" }}
              title="Настройки комнаты"
            >
              <IconSettings className="w-4 h-4" />
            </button>

            {showSettingsMenu && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: "200px",
                background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 50, padding: "6px",
                color: "var(--text-primary)"
              }}>
                <button onClick={onToggleStatus} style={{
                  width: "100%", padding: "8px 10px", textAlign: "left", background: "transparent",
                  border: "none", cursor: "pointer", borderRadius: "6px", fontSize: "0.85rem",
                  display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)"
                }}>
                  {roomStatus === "open" ? <IconArchive className="w-4 h-4" /> : <IconUnlock className="w-4 h-4" />}
                  {roomStatus === "open" ? "Закрыть комнату" : "Открыть комнату"}
                </button>
                <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />
                <button onClick={onClearData} style={{
                  width: "100%", padding: "8px 10px", textAlign: "left", background: "transparent",
                  border: "none", cursor: "pointer", borderRadius: "6px", fontSize: "0.85rem",
                  display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-danger)"
                }}>
                  <IconTrash className="w-4 h-4" /> Очистить историю и взносы
                </button>
                {/* ✅ Кнопка удаления комнаты */}
                <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />
                <button onClick={onDeleteRoom} style={{
                  width: "100%", padding: "8px 10px", textAlign: "left", background: "transparent",
                  border: "none", cursor: "pointer", borderRadius: "6px", fontSize: "0.85rem",
                  display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-danger)"
                }}>
                  <IconTrash className="w-4 h-4" /> Удалить комнату
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {saving && <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Сохранение...</span>}
        <button className="theme-toggle btn-small" onClick={toggleTheme} title={theme === "light" ? "Тёмная тема" : "Светлая тема"} disabled={saving}>
          {theme === "light" ? <IconMoon className="w-4 h-4" /> : <IconSun className="w-4 h-4" />}
        </button>

        {isProtected && (
          isUnlocked ? (
            <button className="btn-small btn-secondary" onClick={lockRoom} style={{ display: "flex", alignItems: "center", gap: "5px" }} disabled={saving}>
              <IconUnlock className="w-4 h-4" /> Открыто
            </button>
          ) : (
            <button className="btn-small btn-secondary" onClick={() => setShowUnlockForm(true)} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <IconLock className="w-4 h-4" /> Заблокировано
            </button>
          )
        )}

        <div style={{ position: "relative" }} ref={accessRef}>
          <button className="btn-secondary btn-small" onClick={() => setShowAccessMenu(!showAccessMenu)} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <IconLink className="w-4 h-4" /> Доступ <span style={{ fontSize: "0.7rem", marginLeft: "2px" }}>▼</span>
          </button>
          {showAccessMenu && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0, minWidth: "220px",
              background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 50, padding: "6px", color: "var(--text-primary)"
            }}>
              {inviteCode && (
                <button onClick={() => copy(inviteLink!, "Ссылка для участников")} style={{ width: "100%", padding: "8px 10px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", borderRadius: "6px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
                  <IconUsers className="w-4 h-4" style={{ color: "var(--text-muted)" }} /> Ссылка для участников
                </button>
              )}
              {inviteCode && (
                <button onClick={() => copy(inviteCode, "Код приглашения")} style={{ width: "100%", padding: "8px 10px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", borderRadius: "6px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
                  <IconKey className="w-4 h-4" style={{ color: "var(--text-muted)" }} /> Код приглашения
                </button>
              )}
              {isProtected && isAdmin && adminLink && (
                <>
                  <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />
                  <button onClick={() => copy(adminLink!, "Ссылка администратора")} style={{ width: "100%", padding: "8px 10px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", borderRadius: "6px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-danger)" }}>
                    <IconLock className="w-4 h-4" /> Ссылка администратора
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}