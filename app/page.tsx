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
    <main className="hero-gradient min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 text-white mb-4">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Split Bill</h1>
          <p className="text-slate-300 mt-2">Делите траты честно и просто</p>
        </div>

        <div className="hero-card">
          <form action={createRoomAction} className="flex-col gap-4 flex">
            <div className="form-group">
              <label className="form-label text-white/90">Название комнаты</label>
              <input
                name="name"
                required
                maxLength={100}
                placeholder="Например, Поездка в Прагу"
                className="input bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div className="form-group">
              <label className="form-label text-white/90">Пароль (опционально)</label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                <input
                  name="password"
                  type="password"
                  maxLength={100}
                  placeholder="Защитите комнату"
                  className="input bg-white/10 border-white/20 text-white placeholder:text-white/40 pl-10"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label text-white/90">Валюта</label>
              <select
                name="currency"
                defaultValue="RUB"
                className="input select bg-white/10 border-white/20 text-white"
              >
                <option value="RUB">RUB</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="KZT">KZT</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-2">
              Создать комнату
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          После создания вы получите ссылку для доступа к комнате
        </p>
      </div>
    </main>
  );
}
