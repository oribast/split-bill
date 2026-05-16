"use client";
import { IconLock, IconEye, IconEyeOff } from "@/components/Icons";

interface Props {
  unlockPassword: string;
  setUnlockPassword: (v: string) => void;
  showUnlockPwd: boolean;
  setShowUnlockPwd: (v: boolean) => void;
  unlockError: string;
  tryUnlock: () => void;
}

export default function UnlockForm({ unlockPassword, setUnlockPassword, showUnlockPwd, setShowUnlockPwd, unlockError, tryUnlock }: Props) {
  return (
    <div className="card unlock-card" style={{padding:"16px", marginBottom:"16px"}}>
      <h3 className="unlock-title" style={{fontSize:"0.95rem", marginBottom:"10px", display:"flex", alignItems:"center", gap:"6px"}}>
        <IconLock className="w-4 h-4"/> Введите пароль комнаты
      </h3>
      <div style={{display:"flex", gap:"10px", alignItems:"flex-start", flexWrap:"wrap"}}>
        <div className="password-field" style={{flex:1, minWidth:"180px", padding:"8px 12px"}}>
          <IconLock className="w-4 h-4"/>
          <input type={showUnlockPwd?"text":"password"} value={unlockPassword} onChange={(e)=>setUnlockPassword(e.target.value)} placeholder="Пароль" onKeyDown={(e)=>e.key==="Enter" && tryUnlock()} autoFocus style={{fontSize:"0.9rem"}} />
          <button type="button" className="password-toggle" onClick={()=>setShowUnlockPwd(!showUnlockPwd)} title={showUnlockPwd?"Скрыть":"Показать"}>
            {showUnlockPwd ? <IconEyeOff className="w-4 h-4"/> : <IconEye className="w-4 h-4"/>}
          </button>
        </div>
        <button className="btn-primary" onClick={tryUnlock} style={{padding:"8px 16px", fontSize:"0.9rem"}}>Разблокировать</button>
      </div>
      {unlockError && <p style={{color:"#e53e3e", fontSize:"0.8rem", marginTop:"6px"}}>{unlockError}</p>}
    </div>
  );
}