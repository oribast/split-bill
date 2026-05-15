export function storeEditKey(key: string) {
  if (typeof window !== 'undefined') sessionStorage.setItem('editKey', key);
}

export function storePassword(password: string) {
  if (typeof window !== 'undefined') sessionStorage.setItem('roomPassword', password);
}

export function getAuthHeaders(editKey?: string): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const key = editKey || sessionStorage.getItem('editKey') || '';
  if (key) return { 'X-Edit-Key': key };
  const password = sessionStorage.getItem('roomPassword');
  if (password) return { Authorization: `Basic ${btoa(`admin:${password}`)}` };
  return {};
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return true;
  return !!sessionStorage.getItem('editKey') || !!sessionStorage.getItem('roomPassword');
}
