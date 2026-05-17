"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { IconLock, IconLink, IconEye, IconEyeOff } from "@/components/Icons";

interface Props {
  editKey: string;
  isProtected: boolean;
}

export default function AccessKeysBlock({ editKey, isProtected }: Props) {
  const [showKey, setShowKey] = useState(false);

  const copyKey = () => {
    navigator.clipboard.writeText(editKey).then(() => toast.success("Ключ скопирован"));
  };

  const copyAuthHeader = () => {
    const header = `X-Edit-Key: ${editKey}`;
    navigator.clipboard.writeText(header).then(() => toast.success("Заголовок скопирован"));
  };

  return (
    <div className="card p-4 space-y-3 text-sm">
      <div className="flex items-center gap-2 font-semibold">
        <IconLock className="w-4 h-4" /> Ключи доступа
      </div>

      <div className="flex items-center justify-between gap-2 p-2 rounded bg-secondary/50">
        <span className="text-muted truncate">Edit Key</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowKey(!showKey)} className="p-1 hover:bg-background rounded" title="Показать/скрыть">
            {showKey ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
          </button>
          <button onClick={copyKey} className="p-1 hover:bg-background rounded" title="Копировать ключ">
            <IconLink className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {showKey && (
        <div className="font-mono text-xs break-all p-2 rounded bg-background border border-border">
          {editKey}
        </div>
      )}

      <button onClick={copyAuthHeader} className="btn-secondary w-full text-xs flex items-center justify-center gap-1">
        <IconLink className="w-3.5 h-3.5" /> Копировать заголовок для API
      </button>

      {isProtected && (
        <p className="text-xs text-muted mt-1">
          🔒 Комната защищена паролем. Для доступа через API используйте <code className="bg-secondary px-1 rounded">Authorization: Basic base64(password)</code>
        </p>
      )}
    </div>
  );
}