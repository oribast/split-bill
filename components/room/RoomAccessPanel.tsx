"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { IconLink, IconKey, IconUsers } from "@/components/Icons";
import { useTheme } from "@/hooks/use-theme";

interface Props {
  roomId: string;
  inviteCode: string;
  isAdmin: boolean;
}

export default function RoomAccessPanel({ roomId, inviteCode, isAdmin }: Props) {
  const { theme } = useTheme();
  const [showAdminLink, setShowAdminLink] = useState(false);

  const isDark = theme === "dark";
  const bg = isDark ? "#1f2937" : "#f9fafb";
  const border = isDark ? "#374151" : "#e5e7eb";
  const innerBg = isDark ? "#111827" : "#ffffff";
  const textMain = isDark ? "#e5e7eb" : "#111827";
  const textMuted = isDark ? "#9ca3af" : "#6b7280";
  const accentDanger = isDark ? "#f87171" : "#dc2626";

  const editKey = typeof window !== "undefined" ? localStorage.getItem(`editKey_${roomId}`) : null;
  const pwdHash = typeof window !== "undefined" ? localStorage.getItem(`password_${roomId}`) : null;

  // ✅ Генерируем ссылку админа из того, чем разблокировали (ключ или пароль)
  let adminLink = null;
  if (editKey) adminLink = `${window.location.origin}/room/${roomId}?editKey=${editKey}`;
  else if (pwdHash) adminLink = `${window.location.origin}/room/${roomId}?pwd=${encodeURIComponent(pwdHash)}`;

  const joinLink = `${window.location.origin}?code=${inviteCode}`;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} скопирован`));
  };

  return (
    <div style={{
      border: `1px solid ${border}`,
      borderRadius: "12px",
      padding: "14px",
      background: bg,
      marginBottom: "16px",
      transition: "all 0.2s ease"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 600, marginBottom: "10px", color: textMain }}>
        <IconKey className="w-4 h-4" /> Доступ и ссылки
      </div>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 10px", background: innerBg, borderRadius: "8px",
        marginBottom: "8px", border: `1px solid ${border}`
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <IconUsers className="w-4 h-4" style={{ color: textMuted }} />
          <span style={{ fontFamily: "monospace", fontWeight: 600, letterSpacing: "1px", fontSize: "0.9rem", color: textMain }}>{inviteCode}</span>
        </div>
        <button onClick={() => copy(inviteCode, "Код")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px", color: textMuted }}>
          <IconLink className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={() => copy(joinLink, "Ссылка для входа")}
        style={{
          width: "100%", padding: "8px", marginBottom: "8px", borderRadius: "8px",
          border: `1px solid ${border}`, background: "transparent", cursor: "pointer",
          fontSize: "0.8rem", color: textMain, display: "flex", alignItems: "center",
          justifyContent: "center", gap: "6px", transition: "background 0.2s"
        }}
      >
        <IconLink className="w-4 h-4" /> Копировать ссылку для участников
      </button>

      {isAdmin && adminLink && (
        <>
          <button
            onClick={() => setShowAdminLink(!showAdminLink)}
            style={{
              width: "100%", padding: "8px", borderRadius: "8px",
              border: `1px solid ${border}`, background: "transparent", cursor: "pointer",
              fontSize: "0.8rem", color: accentDanger, marginBottom: "8px", transition: "background 0.2s"
            }}
          >
            {showAdminLink ? "Скрыть ссылку администратора" : "Показать ссылку администратора"}
          </button>
          {showAdminLink && (
            <div style={{
              padding: "8px 10px", background: innerBg, borderRadius: "8px",
              border: `1px solid ${border}`, wordBreak: "break-all", fontSize: "0.75rem",
              fontFamily: "monospace", color: textMuted
            }}>
              {adminLink}
            </div>
          )}
        </>
      )}

      <p style={{ fontSize: "0.7rem", color: textMuted, margin: 0, textAlign: "center" }}>
        Код приглашения — для входа участников. Пароль или ссылка администратора — для полного управления.
      </p>
    </div>
  );
}