"use client";
import { Participant } from "@/lib/types";
import { Finances } from "@/lib/calculations";
import { fmt } from "@/lib/room-utils";

interface Props {
  participants: Participant[];
  finances: Finances;
}

export default function TotalsBlock({ participants, finances }: Props) {
  return (
    <div className="card" style={{padding:"16px"}}>
      <h2 style={{fontSize:"1.1rem", marginBottom:"10px"}}>Итого: потрачено на участников</h2>
      <p style={{fontSize:"0.8rem", color:"var(--text-muted)", marginBottom:"10px"}}>
        Сумма всех долей, начисленных на каждого участника (независимо от того, кто платил).
      </p>
      {participants.map(p => {
        const cons = finances.consumed[p.id] || 0;
        return (
          <div key={p.id} className="total-row" style={{padding:"8px 0", fontSize:"0.9rem"}}>
            <span>{p.name}</span>
            <span style={{fontWeight:600}}>{fmt(cons)}</span>
          </div>
        );
      })}
      <div className="total-row" style={{marginTop:"6px", paddingTop:"10px", borderTop:"2px solid var(--border-color)", fontSize:"0.95rem"}}>
        <span style={{fontWeight:700}}>Общий расход</span>
        <span style={{fontWeight:700}}>{fmt(Object.values(finances.consumed).reduce((a,b)=>a+b, 0))}</span>
      </div>
    </div>
  );
}