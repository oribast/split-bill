"use client";
import { IconPlus, IconTrash, IconUsers } from "@/components/Icons";
import { Participant } from "@/lib/types";
import { Finances } from "@/lib/calculations";
import { fmt } from "@/lib/room-utils";

interface Props {
  participants: Participant[];
  isUnlocked: boolean;
  newName: string;
  setNewName: (v: string) => void;
  addParticipant: () => void;
  updateName: (id: string, name: string) => void;
  saveName: (id: string, name: string) => void;
  removeParticipant: (id: string) => void;
  finances: Finances;
}

export default function ParticipantsSidebar({ participants, isUnlocked, newName, setNewName, addParticipant, updateName, saveName, removeParticipant, finances }: Props) {
  return (
    <aside className="w-full lg:w-80 lg:min-w-[320px] flex-shrink-0">
      <div className="card" style={{position:"sticky", top:"16px", padding:"16px"}}>
        <h2 style={{fontSize:"1.1rem", marginBottom:"12px"}}>Участники</h2>
        {!isUnlocked ? null : (
          <div className="form-row" style={{marginBottom:"12px", gap:"8px"}}>
            <div className="form-group" style={{flex:1}}>
              <label style={{fontSize:"0.8rem"}}>Имя</label>
              <input type="text" value={newName} onChange={(e)=>setNewName(e.target.value)} placeholder="Например, Алексей" onKeyDown={(e)=>e.key==="Enter" && addParticipant()} autoFocus={participants.length===0} style={{padding:"8px", fontSize:"0.9rem"}} />
            </div>
            <button className="btn-primary" onClick={addParticipant} style={{padding:"8px 12px", fontSize:"0.9rem", display:"flex", alignItems:"center", gap:"4px"}}>
              <IconPlus className="w-4 h-4"/> Добавить
            </button>
          </div>
        )}
        {participants.length===0 ? (
          <div className="empty-state" style={{padding:"24px 16px"}}>
            <IconUsers className="w-8 h-8 mx-auto mb-2 text-muted"/>
            <div className="empty-title" style={{fontSize:"1rem"}}>Пока нет участников</div>
            <div className="empty-subtitle" style={{fontSize:"0.85rem"}}>Добавьте первого, чтобы начать делить счёт</div>
          </div>
        ) : (
          <div className="participants-list" style={{gap:"8px"}}>
            {participants.map(p=>{
              const bal = finances.balances[p.id] || 0;
              const balColor = bal > 0 ? "text-red-500" : bal < 0 ? "text-green-500" : "text-muted";
              const balLabel = bal > 0 ? "должен" : bal < 0 ? "вам должны" : "расчёт";
              return (
                <div key={p.id} className="participant-item" style={{flexDirection:"column", alignItems:"stretch", gap:"6px", padding:"10px"}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                    {isUnlocked ? (
                      <input type="text" value={p.name} onChange={(e)=>updateName(p.id, e.target.value)} onBlur={(e)=>saveName(p.id, e.target.value)} style={{flex:1, fontSize:"0.9rem", padding:"4px"}} />
                    ) : (
                      <span style={{flex:1, fontWeight:500, fontSize:"0.9rem"}}>{p.name}</span>
                    )}
                    {!isUnlocked ? null : (
                      <button className="btn-secondary btn-small" onClick={()=>removeParticipant(p.id)} style={{marginLeft:"6px", padding:"4px 8px", display:"flex", alignItems:"center"}}>
                        <IconTrash className="w-3.5 h-3.5"/>
                      </button>
                    )}
                  </div>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
                    <span style={{fontSize:"0.75rem", color:"var(--text-muted)"}}>Баланс:</span>
                    <span className={`participant-amount ${balColor}`} style={{minWidth:"auto", fontSize:"0.9rem"}}>
                      {bal > 0 ? "+" : ""}{fmt(bal)} <span style={{fontSize:"0.7rem", fontWeight:400, color:"var(--text-muted)"}}>({balLabel})</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}