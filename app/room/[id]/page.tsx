import { notFound } from 'next/navigation';
import { db } from '@/db';
import { rooms } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { RoomClient } from '@/components/RoomClient';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ key?: string }>;
};

export default async function RoomPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { key } = await searchParams;

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, id),
    columns: { id: true, name: true, currency: true, passwordHash: true, editKey: true },
  });

  if (!room) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <RoomClient
          roomId={id}
          initialEditKey={key || ''}
          hasPassword={!!room.passwordHash}
          roomName={room.name}
          currency={room.currency}
          realEditKey={room.editKey}
        />
      </div>
    </main>
  );
}
