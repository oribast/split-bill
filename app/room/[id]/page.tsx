import { notFound } from 'next/navigation';
import RoomClient from './RoomClient';
import { db } from '@/db';
import { rooms } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { RoomWithRelations } from '@/lib/types';

async function getRoom(id: string) {
  return db.query.rooms.findFirst({
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
}
export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await getRoom(id);
  
  if (!room) notFound();
  
  return <RoomClient initialData={room as RoomWithRelations} roomId={id} />;
}