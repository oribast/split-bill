"use client";
import { IconHistory, IconRollback } from "@/components/Icons";
import { EventWithRelations, Participant } from "@/lib/types";
import { fmt, formatDate, parseDescription } from "@/lib/utils";

interface Props {
  events: EventWithRelations[];
  participants: Participant[];
  isUnlocked: boolean;
  handleRollback: (id: string) => void;
}

export default function HistoryBlock({ events, participants, isUnlocked, handleRollback }: Props) {
  return (
    <div className="card" style={{ padding: "16px" }}>
      <h2 style={{ fontSize: "1.1rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
        <IconHistory className="w-5 h-5" /> История операций
      </h2>
      
      {events.length === 0 ? (
        <div className="empty-state" style={{ padding: "24px 16px" }}>
          <IconHistory className="w-8 h-8 mx-auto mb-2 text-muted" />
          <div className="empty-title" style={{ fontSize: "1rem" }}>Пока нет операций</div>
          <div className="empty-subtitle" style={{ fontSize: "0.85rem" }}>Начислите или распределите сумму — записи появятся здесь</div>
        </div>
      ) : (
        <div className="logs-modern" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {events.map(log => {
            const rawDate = log.createdAt ?? (log as any).created_at;
            const dateStr = formatDate(rawDate);
            
            const { main, comment } = parseDescription(log.description || "");
            
            return (
              <div key={log.id} className={`log-card ${log.type} ${log.isReverted ? "reverted" : ""}`} style={{ padding: "12px" }}>
                <div className="log-card-header" style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="log-card-meta" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className={`log-badge ${log.type}`} style={{ fontSize: "0.65rem", padding: "2px 8px" }}>
                      {log.type === "individual" ? "Индивидуальная" : "Групповая"}
                    </span>
                    <span className="log-date" style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                      {dateStr}{log.isReverted && <span className="reverted-label" style={{ color: "var(--accent-danger)", marginLeft: "4px" }}> · Отменено</span>}
                    </span>
                  </div>
                  {isUnlocked && !log.isReverted && (
                    <button 
                      className="btn-secondary btn-small" 
                      onClick={() => handleRollback(log.id)} 
                      style={{ padding: "4px 10px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <IconRollback className="w-3.5 h-3.5" /> Откатить
                    </button>
                  )}
                </div>
                <div className="log-card-body" style={{ marginBottom: "8px" }}>
                  <div className="log-title" style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "4px" }}>{main}</div>
                  {log.payer?.name && (
                    <div className="log-payer" style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      <span className="log-label">Оплатил:</span> {log.payer.name}
                    </div>
                  )}
                  {comment && (
                    <div className="log-note-modern" style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                      <span className="log-label">Комментарий:</span> {comment}
                    </div>
                  )}
                </div>
                {log.entries && log.entries.length > 0 && (
                  <div className="log-entries-modern" style={{ paddingTop: "8px", borderTop: "1px solid var(--border)", marginTop: "8px" }}>
                    {log.entries.map((entry, idx) => {
                      const name = participants.find(pp => pp.id === entry.participantId)?.name || "Удалённый";
                      return (
                        <div key={idx} className="log-entry-row" style={{ fontSize: "0.85rem", padding: "2px 0", display: "flex", justifyContent: "space-between" }}>
                          <span className="entry-name">{name}</span>
                          <span className="entry-amount">+{fmt(entry.amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}