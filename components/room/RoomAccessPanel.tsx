"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { IconLink, IconKey, IconUsers } from "@/components/Icons";
import { useTheme } from "@/hooks/use-theme";

interface Props {
  roomId: string;
  inviteCode: string;
}

export default function RoomAccessPanel({ roomId, inviteCode }: Props) {
  const { theme } = useTheme();
  const [showAdminLink, setShowAdminLink] = useState(false);

  const editKey = typeof window !== "undefined" ? localStorage.getItem(`editKey_${roomId}`) : null;
  const adminLink = editKey ? `${window.location.origin}/room/${roomId}?editKey=${editKey}` : null;
  const joinLink = `${window.location.origin}?code=${inviteCode}`;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} скопирован`));
  };

  const bg = theme === "dark" ? "#1f2937" : "#f9fafb";
  const border = theme === "dark" ? "#374151" : "#e5e7eb";
  const textMuted = theme === "dark" ? "#9ca3af" : "#6b7280";

  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: "12px", padding: "14px", background: bg, marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 600, marginBottom: "10px", color: theme === "dark" ? "#e5e7eb" : "#111827" }}>
        <IconKey className="w-4 h-4" /> Доступ и ссылки
      </div>

      {/* Код приглашения */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: theme === "dark" ? "#111827" : "#ffffff", borderRadius: "8px", marginBottom: "8px", border: `1px solid ${border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <IconUsers className="w-4 h-4" style={{ color: textMuted }} />
          <span style={{ fontFamily: "monospace", fontWeight: 600, letterSpacing: "1px", fontSize: "0.9rem" }}>{inviteCode}</span>
        </div>
        <button onClick={() => copy(inviteCode, "Код")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px", color: textMuted }}>
          <IconLink className="w-4 h-4" />
        </button>
      </div>

      {/* Ссылка для входа */}
      <button 
        onClick={() => copy(joinLink, "Ссылка для входа")}
        style={{ width: "100%", padding: "8px", marginBottom: "8px", borderRadius: "8px", border: `1px solid ${border}`, background: "transparent", cursor: "pointer", fontSize: "0.8rem", color: theme === "dark" ? "#d1d5db" : "#374151", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
      >
        <IconLink className="w-4 h-4" /> Копировать ссылку для участников
      </button>

      {/* Админ-ссылка (скрыта по умолчанию) */}
      {adminLink && (
        <>
          <button 
            onClick={() => setShowAdminLink(!showAdminLink)}
            style={{ width: "100%", padding: "8px", borderRadius: "8px", border: `1px solid ${border}`, background: "transparent", cursor: "pointer", fontSize: "0.8rem", color: theme === "dark" ? "#f87171" : "#dc2626", marginBottom: "8px" }}
          >
            {showAdminLink ? "Скрыть ссылку администратора" : "Показать ссылку администратора"}
          </button>
          {showAdminLink && (
            <div style={{ padding: "8px 10px", background: theme === "dark" ? "#111827" : "#ffffff", borderRadius: "8px", border: `1px solid ${border}`, wordBreak: "break-all", fontSize: "0.75rem", fontFamily: "monospace", color: theme === "dark" ? "#9ca3af" : "#6b7280", marginBottom: "8px" }}>
              {adminLink}
            </div>
          )}
        </>
      )}

      <p style={{ fontSize: "0.7rem", color: textMuted, margin: 0, textAlign: "center" }}>
        Код приглашения даёт доступ к просмотру. Ссылка администратора даёт полные права.
      </p>
    </div>
  );
}