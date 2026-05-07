import { useState } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { IconLockClosed, IconEye, IconEyeOff } from '../components/Icons'

export default function Home() {
  const [roomId, setRoomId] = useState('')
  const [loading, setLoading] = useState(false)
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const createRoom = async () => {
    setLoading(true)
    try {
      const body = {}
      if (usePassword && password.trim()) body.password = password.trim()
      const res = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.id) {
        if (usePassword && password.trim() && typeof window !== 'undefined') {
          sessionStorage.setItem(`room_${data.id}_password`, password.trim())
        }
        toast.success('Комната создана!')
        router.push(`/room/${data.id}`)
      } else {
        toast.error('Ошибка создания комнаты')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = () => {
    const id = roomId.trim()
    if (id) {
      router.push(`/room/${id}`)
    } else {
      toast.error('Введите ID комнаты')
    }
  }

  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '80px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Split Bill</h1>
      <p style={{ color: '#718096', marginBottom: '48px', fontSize: '1.125rem' }}>
        Создай комнату для разделения счёта и поделись ссылкой
      </p>

      <div className="card" style={{ maxWidth: '400px', margin: '0 auto 24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', justifyContent: 'center', color: '#4a5568' }}>
            <input
              type="checkbox"
              checked={usePassword}
              onChange={(e) => {
                setUsePassword(e.target.checked)
                if (!e.target.checked) { setPassword(''); setShowPassword(false) }
              }}
            />
            Защитить комнату паролем
          </label>
          {usePassword && (
            <div className="password-field" style={{ marginTop: '12px' }}>
              <IconLockClosed className="icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Придумайте пароль"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                title={showPassword ? 'Скрыть' : 'Показать'}
              >
                {showPassword ? <IconEyeOff className="icon" /> : <IconEye className="icon" />}
              </button>
            </div>
          )}
        </div>
        <button
          className="btn-primary"
          onClick={createRoom}
          disabled={loading || (usePassword && !password.trim())}
          style={{ width: '100%', padding: '16px', fontSize: '1.125rem' }}
        >
          {loading ? 'Создание...' : 'Создать новую комнату'}
        </button>
      </div>

      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '12px', color: '#4a5568' }}>
          Или войти по ID комнаты
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Например: a3f9k2"
            onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
            style={{ flex: 1 }}
          />
          <button className="btn-primary" onClick={joinRoom}>
            Войти
          </button>
        </div>
      </div>
    </div>
  )
}
