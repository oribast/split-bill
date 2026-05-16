"use client";
import { IconLock, IconUnlock, IconLink, IconSun, IconMoon } from "@/components/Icons";

interface RoomHeaderProps {
  roomId: string;
  roomName: string; // ✅ Новое поле
  saving: boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
  isProtected: boolean;
  isUnlocked: boolean;
  lockRoom: () => void;
  setShowUnlockForm: (v: boolean) => void;
  copyLink: () => void;
}

export default function RoomHeader({
  roomId,
  roomName,
  saving,
  theme,
  toggleTheme,
  isProtected,
  isUnlocked,
  lockRoom,
  setShowUnlockForm,
  copyLink,
}: RoomHeaderProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
      <h1 style={{ marginBottom: 0, fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
        Tally <span style={{ fontWeight: 400, opacity: 0.6, fontSize: "0.9em" }}>| {roomName}</span>
      </h1>
      
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

        <button className="btn-secondary btn-small" onClick={copyLink} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <IconLink className="w-4 h-4" /> Ссылка
        </button>
      </div>
    </div>
  );
}