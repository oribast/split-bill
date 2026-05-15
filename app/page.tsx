import { redirect } from 'next/navigation';
import { createRoom } from '@/lib/repositories/room';
import { createRoomSchema } from '@/lib/validations';
import { Lock, ArrowRight } from 'lucide-react';

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
    <div className="container" style={{ textAlign: 'center', paddingTop: '80px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Split Bill</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '48px', fontSize: '1.125rem' }}>
        Создай комнату для разделения счёта и поделись ссылкой
      </p>

      <div className="card" style={{ maxWidth: '400px', margin: '0 auto 24px' }}>
        <form action={createRoomAction} className="flex-col gap-4 flex">
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label>Название комнаты</label>
            <input
              name="name"
              required
              maxLength={100}
              placeholder="Например, Поездка в Берлин"
            />
          </div>

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label>Валюта</label>
            <select name="currency" defaultValue="RUB">
              <option value="RUB">RUB</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="KZT">KZT</option>
            </select>
          </div>

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label>Пароль (опционально)</label>
            <div className="password-field">
              <Lock className="icon" style={{ color: 'var(--text-muted)' }} />
              <input
                name="password"
                type="password"
                maxLength={100}
                placeholder="Защитите комнату"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1.05rem', marginTop: 4 }}>
            Создать комнату
            <ArrowRight className="icon" />
          </button>
        </form>
      </div>
    </div>
  );
}
