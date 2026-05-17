import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Разрешаем запросы с любых источников (для простоты, в продакшене лучше ограничить)
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Edit-Key, X-Participant-Key, X-Idempotency-Key');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};