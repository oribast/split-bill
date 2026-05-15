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
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="w-full max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            Разделение счетов
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Создайте комнату и делите траты честно
          </p>
        </div>

        <form action={createRoomAction} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
              Название комнаты
            </label>
            <input
              name="name"
              required
              maxLength={100}
              placeholder="Например, Поездка в Берлин"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
              Пароль (опционально)
            </label>
            <input
              name="password"
              type="password"
              maxLength={100}
              placeholder="Защитите комнату паролем"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
              Валюта
            </label>
            <select
              name="currency"
              defaultValue="RUB"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="RUB">RUB</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="KZT">KZT</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all active:scale-[0.98]"
          >
            Создать комнату
          </button>
        </form>
      </div>
    </main>
  );
}
