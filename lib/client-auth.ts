export function storeEditKey(key: string) {
  if (typeof window !== 'undefined') sessionStorage.setItem('editKey', key);
}

export function storePassword(password: string) {
  if (typeof window !== 'undefined') sessionStorage.setItem('roomPassword', password);
}

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const editKey = sessionStorage.getItem('editKey');
  if (editKey) return { 'X-Edit-Key': editKey };
  const password = sessionStorage.getItem('roomPassword');
  if (password) return { Authorization: `Basic ${btoa(`admin:${password}`)}` };
  return {};
}

export function isAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  return !!sessionStorage.getItem('editKey');
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return true;
  return !!sessionStorage.getItem('editKey') || !!sessionStorage.getItem('roomPassword');
}
