import { redirect } from 'next/navigation';
import { createRoom } from '@/lib/repositories/room';
import { createRoomSchema } from '@/lib/validations';
import { Wallet, ArrowRight, Shield } from 'lucide-react';

export default function HomePage() {
  async function createRoomAction(formData: FormData) {
    'use server';

    const parsed = createRoomSchema.safeParse({
      name: formData.get('name'),
      password: formData.get('password') || undefined,
      currency: formData.get('currency') || 'RUB',
    });

    if (!parsed.success) throw new Error('Invalid input');

    const room = await createRoom(parsed.data);
    redirect(`/room/${room.id}?key=${room.editKey}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 mb-4">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Split Bill</h1>
          <p className="text-slate-400 mt-2">Делите траты честно и просто</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form action={createRoomAction} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-200">Название комнаты</label>
              <input
                name="name"
                required
                maxLength={100}
                placeholder="Например, Поездка в Прагу"
                className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-200">Пароль (опционально)</label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  name="password"
                  type="password"
                  maxLength={100}
                  placeholder="Защитите комнату"
                  className="w-full rounded-xl border border-slate-600 bg-slate-800/50 pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-200">Валюта</label>
              <select
                name="currency"
                defaultValue="RUB"
                className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              >
                <option value="RUB">RUB</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="KZT">KZT</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full group bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3.5 font-semibold shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Создать комнату
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          После создания вы получите ссылку для доступа к комнате
        </p>
      </div>
    </main>
  );
}
