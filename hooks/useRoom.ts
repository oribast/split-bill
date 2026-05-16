import useSWR from 'swr';

interface Participant { id: string; name: string; participantKey: string; }
interface EventEntry { participantId: string; amount: number; }
interface Event { 
  id: string; 
  description: string; 
  amount: number; 
  type: string; 
  payerId: string;
  payer?: { name: string }; 
  isReverted: boolean;
  entries: EventEntry[]; 
  createdAt: string;
}
interface Room { id: string; name: string; participants: Participant[]; events: Event[]; }

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useRoom(roomId: string, initialData: Room) {
  const { data, mutate, error, isLoading } = useSWR<{ room: Room }>(
    `/api/v1/rooms/${roomId}`,
    fetcher,
    { fallbackData: { room: initialData } }
  );

  return {
    room: data?.room || initialData,
    mutate,
    error,
    isLoading
  };
}