// lib/api.ts
import { Room, Participant, Event } from '@/lib/types';

// Получаем заголовки авторизации для конкретной комнаты
function getHeaders(roomId: string): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  
  // 1. Edit Key (Admin)
  const editKey = sessionStorage.getItem(`editKey_${roomId}`);
  if (editKey) headers['x-edit-key'] = editKey;
  
  // 2. Basic Auth (Password) - если есть
  const pass = sessionStorage.getItem(`password_${roomId}`);
  if (pass) headers['Authorization'] = `Basic ${pass}`;
  
  return headers;
}

export async function createRoom(name: string, password?: string) {
  const body: any = { name };
  if (password) body.password = password;
  
  const res = await fetch('/api/v1/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create room');
  }
  
  return await res.json(); // { room, editKey }
}

export async function fetchRoom(roomId: string): Promise<Room> {
  const res = await fetch(`/api/v1/rooms/${roomId}`, { 
    headers: getHeaders(roomId),
    cache: 'no-store' 
  });
  if (res.status === 401 || res.status === 403) throw new Error('auth_required');
  if (!res.ok) throw new Error('not_found');
  const data = await res.json();
  return data.room;
}

export async function addParticipant(roomId: string, name: string): Promise<Participant> {
  const res = await fetch(`/api/v1/rooms/${roomId}/participants`, {
    method: 'POST',
    headers: getHeaders(roomId),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to add');
  const data = await res.json();
  return data.participant;
}

export async function deleteParticipant(roomId: string, pid: string) {
  const res = await fetch(`/api/v1/rooms/${roomId}/participants/${pid}`, {
    method: 'DELETE',
    headers: getHeaders(roomId),
  });
  if (!res.ok) throw new Error('Failed to delete');
}

export async function addExpense(roomId: string, payload: any, type: 'shared' | 'individual') {
  const res = await fetch(`/api/v1/rooms/${roomId}/expenses/${type}`, {
    method: 'POST',
    headers: { ...getHeaders(roomId), 'X-Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed');
  }
  return await res.json();
}

export async function revertEvent(roomId: string, eventId: string) {
  const res = await fetch(`/api/v1/rooms/${roomId}/events/${eventId}`, {
    method: 'POST',
    headers: getHeaders(roomId),
  });
  if (!res.ok) throw new Error('Failed to revert');
}

export async function unlockRoom(roomId: string, password: string): Promise<boolean> {
  // Пытаемся сделать запрос с новым паролем
  // Для Basic Auth нужно base64(user:password), user может быть любым, например 'admin'
  const authHeader = `Basic ${btoa(`admin:${password}`)}`;
  
  const res = await fetch(`/api/v1/rooms/${roomId}`, {
    headers: { 'Authorization': authHeader }
  });
  
  if (res.ok) {
    // Пароль подошел, сохраняем
    sessionStorage.setItem(`password_${roomId}`, btoa(password));
    return true;
  }
  return false;
}