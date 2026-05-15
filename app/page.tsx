import { redirect } from 'next/navigation';
import { createRoom } from '@/lib/repositories/room';
import { createRoomSchema } from '@/lib/validations';

export default function HomePage() {
  async function createRoomAction(formData: FormData) {
    'use server';

    const parsed = createRoomSchema.safeParse({
      name: formData.get('name'),
      password: formData.get('password') || undefined,
      currency: formData.get('currency') || 'RUB',
    });

    if (!parsed.success) {
      throw new Error('Invalid input');
    }

    const room = await createRoom(parsed.data);
    redirect(`/room/${room.id}?key=${room.editKey}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Разделение счетов
        </h1>
        <form action={createRoomAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Название комнаты
            </label>
            <input
              name="name"
              required
              maxLength={100}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Пароль (опционально)
            </label>
            <input
              name="password"
              type="password"
              maxLength={100}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Валюта
            </label>
            <select
              name="currency"
              defaultValue="RUB"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="RUB">RUB</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="KZT">KZT</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700"
          >
            Создать комнату
          </button>
        </form>
      </div>
    </main>
  );
}
