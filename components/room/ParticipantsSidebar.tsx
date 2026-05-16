"use client";
import { useState } from "react";
import { Participant } from "@/lib/types";
import { Finances } from "@/lib/calculations";
// Замени импорты иконок на свои из @/components/Icons, если названия отличаются
import { IconTrash, IconPlus, IconCheck, IconX, IconEdit } from "@/components/Icons";

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

// ✅ Человекопонятный формат баланса
const formatBalance = (cents: number) => {
  const value = cents / 100;
  if (value === 0) return { text: "Нет долгов", color: "var(--text-muted)" };
  if (value > 0) return { text: `Должен ${value.toFixed(2)} ₽`, color: "var(--accent-danger, #ef4444)" };
  return { text: `Вам должны ${Math.abs(value).toFixed(2)} ₽`, color: "var(--accent-success, #22c55e)" };
};

export default function ParticipantsSidebar({
  participants, isUnlocked, newName, setNewName, addParticipant,
  updateName, saveName, removeParticipant, finances
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const startEdit = (p: Participant) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const confirmEdit = (id: string) => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== participants.find(p => p.id === id)?.name) {
      saveName(id, trimmed);
    }
    cancelEdit();
  };

  return (
    <aside className="w-full lg:w-80 flex-shrink-0">
      <div className="card p-4 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">👥 Участники</h2>

        <div className="space-y-2">
          {participants.length === 0 && (
            <div className="text-sm text-muted text-center py-4">Пока пусто. Добавьте первого участника.</div>
          )}

          {participants.map(p => {
            const bal = finances.balances[p.id] || 0;
            const { text, color } = formatBalance(bal);
            const isEditing = editingId === p.id;

            return (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/40 hover:bg-secondary/70 transition">
                {/* Левая часть: Имя + Баланс */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => {
                        setEditName(e.target.value);
                        updateName(p.id, e.target.value); // оптимистичное обновление
                      }}
                      onKeyDown={e => e.key === "Enter" && confirmEdit(p.id)}
                      className="w-full px-2 py-1 text-sm rounded border bg-background outline-none"
                    />
                  ) : (
                    <div
                      className="text-sm font-medium truncate cursor-pointer hover:underline flex items-center gap-1"
                      onClick={() => isUnlocked && startEdit(p)}
                      title="Нажмите для редактирования"
                    >
                      {p.name} {isUnlocked && <IconEdit className="w-3 h-3 opacity-40" />}
                    </div>
                  )}
                  {/* Баланс строго под именем, без кривого центрирования */}
                  <div className="text-xs mt-0.5 font-medium" style={{ color }}>
                    {text}
                  </div>
                </div>

                {/* Правая часть: Кнопки действий */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isEditing ? (
                    <>
                      <button onClick={() => confirmEdit(p.id)} className="p-1.5 rounded hover:bg-green-500/20 text-green-600 transition">
                        <IconCheck className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="p-1.5 rounded hover:bg-red-500/20 text-red-500 transition">
                        <IconX className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    isUnlocked && (
                      <button
                        onClick={() => removeParticipant(p.id)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-500 transition"
                        title="Удалить участника"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Форма добавления */}
        {isUnlocked && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addParticipant()}
              placeholder="Имя участника"
              className="flex-1 px-3 py-2 text-sm rounded border bg-background outline-none"
            />
            <button onClick={addParticipant} className="btn-primary px-3 py-2 flex items-center gap-1 whitespace-nowrap">
              <IconPlus className="w-4 h-4" /> Добавить
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}