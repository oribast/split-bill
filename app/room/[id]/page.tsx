import { notFound } from 'next/navigation';
import RoomClient from './RoomClient';

async function getRoom(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/rooms/${id}`, {
    cache: 'no-store' // Всегда свежие данные
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function RoomPage({ params }: { params: { id: string } }) {
  const data = await getRoom(params.id);
  if (!data) notFound();

  return <RoomClient initialData={data.room} roomId={params.id} />;
}