"use client";
import { Participant } from "@/lib/types";

interface Props {
  participants: Participant[];
  sharedAmount: string;
  setSharedAmount: (v: string) => void;
  sharedPayerId: string;
  setSharedPayerId: (v: string) => void;
  sharedNote: string;
  setSharedNote: (v: string) => void;
  selectedIds: string[];
  toggleSelectedId: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  sharedPreview: { name: string; amount: number }[] | null;
  distributeShared: () => void;
}

export default function SharedExpenseForm({ participants, sharedAmount, setSharedAmount, sharedPayerId, setSharedPayerId, sharedNote, setSharedNote, selectedIds, toggleSelectedId, selectAll, deselectAll, sharedPreview, distributeShared }: Props) {
  return (
    <div className="card" style={{padding:"16px"}}>
      <h2 style={{fontSize:"1.1rem", marginBottom:"12px"}}>Раскидать сумму между участниками</h2>
      <div className="form-row" style={{gap:"10px"}}>
        <div className="form-group"><label style={{fontSize:"0.8rem"}}>Сумма для распределения</label><input type="number" value={sharedAmount} onChange={(e)=>setSharedAmount(e.target.value)} placeholder="0.00" step="0.01" min="0" style={{padding:"8px", fontSize:"0.9rem"}} /></div>
        <div className="form-group"><label style={{fontSize:"0.8rem"}}>Кто платил</label><select value={sharedPayerId} onChange={(e)=>setSharedPayerId(e.target.value)} style={{padding:"8px", fontSize:"0.9rem"}}><option value="">Выберите плательщика</option>{participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      </div>
      <div className="form-group" style={{marginTop:"10px"}}><label style={{fontSize:"0.8rem"}}>Примечание</label><input type="text" value={sharedNote} onChange={(e)=>setSharedNote(e.target.value)} placeholder="Например: Общий чек" onKeyDown={(e)=>e.key==="Enter" && distributeShared()} style={{padding:"8px", fontSize:"0.9rem"}} /></div>
      <div style={{marginBottom:"10px", marginTop:"10px", display:"flex", gap:"6px"}}>
        <button className="btn-secondary btn-small" onClick={selectAll} style={{padding:"6px 10px", fontSize:"0.8rem"}}>Выбрать всех</button>
        <button className="btn-secondary btn-small" onClick={deselectAll} style={{padding:"6px 10px", fontSize:"0.8rem"}}>Снять всех</button>
      </div>
      <div className="checkbox-grid" style={{gap:"6px"}}>
        {participants.map(p=>(
          <label key={p.id} className="checkbox-item" style={{padding:"6px 10px", fontSize:"0.9rem"}}><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={()=>toggleSelectedId(p.id)} className="mr-2"/><span>{p.name}</span></label>
        ))}
      </div>
      {sharedPreview && (
        <div className="preview-box" style={{marginTop:"10px", padding:"10px"}}>
          <div className="preview-title" style={{fontSize:"0.85rem", marginBottom:"6px"}}>Предпросмотр распределения:</div>
          {sharedPreview.map((item, idx)=><div key={idx} className="preview-row" style={{fontSize:"0.85rem", padding:"3px 0"}}><span>{item.name}</span><span>+{item.amount.toFixed(2)} ₽</span></div>)}
        </div>
      )}
      <button className="btn-primary" style={{marginTop:"10px", padding:"10px", fontSize:"0.9rem"}} onClick={distributeShared} disabled={selectedIds.length===0}>Распределить поровну ({selectedIds.length} чел.)</button>
    </div>
  );
}