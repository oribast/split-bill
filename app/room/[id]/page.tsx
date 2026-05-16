import { notFound } from 'next/navigation';
import RoomClient from './RoomClient';
import { db } from '@/db';
import { rooms } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function getRoom(id: string) {
  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, id),
    with: {
      participants: true,
      events: {
        with: {
          entries: true,
          payer: { columns: { id: true, name: true } },
          targetParticipant: { columns: { id: true, name: true } }
        },
        orderBy: (events, { desc }) => [desc(events.createdAt)]
      }
    }
  });

  return room;
}

export default async function RoomPage({ params }: { params: { id: string } }) {
  const room = await getRoom(params.id);
  if (!room) notFound();

  // Передаём данные напрямую в клиентский компонент
  return <RoomClient initialData={room} roomId={params.id} />;
}