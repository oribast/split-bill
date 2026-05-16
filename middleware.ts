import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Здесь можно добавить логику редиректа, если нужно.
  // Реальная аутентификация происходит в API routes через getAuthContext
  
  const response = NextResponse.next();
  
  // Разрешаем CORS для локальной разработки если нужно
  response.headers.set('Access-Control-Allow-Origin', '*');
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};