"use client";
import { Participant } from "@/lib/types";

interface Props {
  participants: Participant[];
  selectedId: string;
  setSelectedId: (v: string) => void;
  payerId: string;
  setPayerId: (v: string) => void;
  individualAmount: string;
  setIndividualAmount: (v: string) => void;
  individualNote: string;
  setIndividualNote: (v: string) => void;
  addToParticipant: () => void;
}

export default function IndividualExpenseForm({ participants, selectedId, setSelectedId, payerId, setPayerId, individualAmount, setIndividualAmount, individualNote, setIndividualNote, addToParticipant }: Props) {
  return (
    <div className="card" style={{padding:"16px"}}>
      <h2 style={{fontSize:"1.1rem", marginBottom:"12px"}}>Накинуть сумму конкретному человеку</h2>
      <div className="form-row" style={{gap:"10px"}}>
        <div className="form-group"><label style={{fontSize:"0.8rem"}}>Кому</label><select value={selectedId} onChange={(e)=>setSelectedId(e.target.value)} style={{padding:"8px", fontSize:"0.9rem"}}><option value="">Выберите участника</option>{participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div className="form-group"><label style={{fontSize:"0.8rem"}}>Кто платил</label><select value={payerId} onChange={(e)=>setPayerId(e.target.value)} style={{padding:"8px", fontSize:"0.9rem"}}><option value="">Выберите плательщика</option>{participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      </div>
      <div className="form-row" style={{marginTop:"10px", gap:"10px"}}>
        <div className="form-group"><label style={{fontSize:"0.8rem"}}>Сумма</label><input type="number" value={individualAmount} onChange={(e)=>setIndividualAmount(e.target.value)} placeholder="0.00" step="0.01" min="0" style={{padding:"8px", fontSize:"0.9rem"}} /></div>
        <button className="btn-primary" onClick={addToParticipant} style={{padding:"8px 14px", fontSize:"0.9rem", alignSelf:"flex-end"}}>Добавить</button>
      </div>
      <div className="form-group" style={{marginTop:"10px"}}><label style={{fontSize:"0.8rem"}}>Примечание</label><input type="text" value={individualNote} onChange={(e)=>setIndividualNote(e.target.value)} placeholder="Например: За пиццу, такси" onKeyDown={(e)=>e.key==="Enter" && addToParticipant()} style={{padding:"8px", fontSize:"0.9rem"}} /></div>
    </div>
  );
}