import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clearAllEvents } from '@/lib/repositories/event';

const clearSchema = z.object({
  confirm: z.literal(true),
});

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = await params;
  const body = await request.json();
  const parsed = clearSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Confirmation required', code: 'confirm_required' },
      { status: 400 }
    );
  }

  await clearAllEvents(roomId);
  return NextResponse.json({ success: true });
}
