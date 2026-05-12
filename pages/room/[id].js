import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { NumericFormat } from 'react-number-format'
import SkeletonRoom from '../../components/SkeletonRoom'
import {
  IconLockClosed,
  IconLockOpen,
  IconEye,
  IconEyeOff,
  IconClipboard,
  IconSun,
  IconMoon,
} from '../../components/Icons'

export default function Room() {
  const router = useRouter()
  const { id } = router.query

  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [isProtected, setIsProtected] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(true)
  const [theme, setTheme] = useState('light')

  const [newName, setNewName] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [individualAmount, setIndividualAmount] = useState('')
  const [individualNote, setIndividualNote] = useState('')
  const [payerId, setPayerId] = useState('')

  const [sharedAmount, setSharedAmount] = useState('')
  const [sharedNote, setSharedNote] = useState('')
  const [sharedPayerId, setSharedPayerId] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [logs, setLogs] = useState([])

  const [showUnlockForm, setShowUnlockForm] = useState(false)
  const [unlockPassword, setUnlockPassword] = useState('')
  const [showUnlockPwd, setShowUnlockPwd] = useState(false)
  const [unlockError, setUnlockError] = useState('')

  const isLocked = isProtected && !isUnlocked

  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {}
    const pwd = sessionStorage.getItem(`room_${id}_password`)
    return pwd ? { 'X-Room-Password': pwd } : {}
  }

  const handleFetchError = async (res) => {
    if (res.status === 403) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`room_${id}_password`)
      }
      setIsUnlocked(false)
      setShowUnlockForm(true)
      setUnlockError('Неверный пароль или доступ запрещён')
      toast.error('Неверный пароль. Введите его снова.')
      return true
    }
    return false
  }

  const fetchRoom = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/room/${id}`)
      if (res.status === 404) {
        setError('Комната не найдена')
        setLoading(false)
        return
      }
      const data = await res.json()
      if (data.participants) {
        setParticipants(
          data.participants.map((p) => ({
            ...p,
            amount: parseFloat(p.amount) || 0,
          }))
        )
      }
      const hasPassword = !!data.isProtected
      setIsProtected(hasPassword)
      if (hasPassword && typeof window !== 'undefined') {
        const saved = sessionStorage.getItem(`room_${id}_password`)
        setIsUnlocked(!!saved)
        if (!saved) setShowUnlockForm(true)
      } else {
        setIsUnlocked(true)
        setShowUnlockForm(false)
      }
      setError('')
    } catch {
      setError('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchLogs = useCallback(async () => {
    if (!id) return
    try {
      const res = await fetch(`/api/room/${id}/events`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch {
      /* ignore */
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchRoom()
      fetchLogs()
    }
  }, [id, fetchRoom, fetchLogs])

  useEffect(() => {
    if (!id || typeof window === 'undefined') return
    const keys = [
      'newName', 'selectedId', 'individualAmount', 'individualNote', 'payerId',
      'sharedAmount', 'sharedNote', 'sharedPayerId', 'selectedIds',
    ]
    keys.forEach((key) => {
      const val = sessionStorage.getItem(`room_${id}_form_${key}`)
      if (val !== null) {
        if (key === 'selectedIds') {
          try { setSelectedIds(JSON.parse(val)) } catch {}
        } else {
          const setter = {
            newName: setNewName,
            selectedId: setSelectedId,
            individualAmount: setIndividualAmount,
            individualNote: setIndividualNote,
            payerId: setPayerId,
            sharedAmount: setSharedAmount,
            sharedNote: setSharedNote,
            sharedPayerId: setSharedPayerId,
          }[key]
          if (setter) setter(val)
        }
      }
    })
  }, [id])

  useEffect(() => {
    if (!id || typeof window === 'undefined') return
    sessionStorage.setItem(`room_${id}_form_newName`, newName)
    sessionStorage.setItem(`room_${id}_form_selectedId`, selectedId)
    sessionStorage.setItem(`room_${id}_form_individualAmount`, individualAmount)
    sessionStorage.setItem(`room_${id}_form_individualNote`, individualNote)
    sessionStorage.setItem(`room_${id}_form_payerId`, payerId)
    sessionStorage.setItem(`room_${id}_form_sharedAmount`, sharedAmount)
    sessionStorage.setItem(`room_${id}_form_sharedNote`, sharedNote)
    sessionStorage.setItem(`room_${id}_form_sharedPayerId`, sharedPayerId)
    sessionStorage.setItem(`room_${id}_form_selectedIds`, JSON.stringify(selectedIds))
  }, [id, newName, selectedId, individualAmount, individualNote, payerId, sharedAmount, sharedNote, sharedPayerId, selectedIds])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const current = document.documentElement.getAttribute('data-theme') || 'light'
    setTheme(current)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  const tryUnlock = async () => {
    if (!unlockPassword.trim()) return
    setSaving(true)
    setUnlockError('')
    try {
      const res = await fetch(`/api/room/${id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: unlockPassword.trim() }),
      })
      if (res.ok) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`room_${id}_password`, unlockPassword.trim())
        }
        setIsUnlocked(true)
        setShowUnlockForm(false)
        setUnlockPassword('')
        setShowUnlockPwd(false)
        toast.success('Комната разблокирована')
      } else {
        setUnlockError('Неверный пароль')
        toast.error('Неверный пароль')
      }
    } catch {
      setUnlockError('Ошибка сети')
      toast.error('Ошибка сети')
    } finally {
      setSaving(false)
    }
  }

  const lockRoom = () => {
    if (window.confirm('Заблокировать редактирование?')) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`room_${id}_password`)
      }
      setIsUnlocked(false)
      setShowUnlockForm(true)
      setUnlockPassword('')
      setUnlockError('')
      toast.success('Редактирование заблокировано')
    }
  }

  const addParticipant = async () => {
    if (isLocked) {
      toast.error('Комната защищена паролем. Нажмите замочек для разблокировки.')
      return
    }
    const name = newName.trim() || `Участник ${participants.length + 1}`
    setSaving(true)
    try {
      const res = await fetch(`/api/room/${id}/participant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name }),
      })
      if (await handleFetchError(res)) return
      if (res.ok) {
        const data = await res.json()
        setParticipants((prev) => [
          ...prev,
          { id: data.id, name: data.name, amount: 0 },
        ])
        setNewName('')
        fetchLogs()
        toast.success(`${data.name} добавлен`)
      } else {
        toast.error('Ошибка добавления')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setSaving(false)
    }
  }

  const removeParticipant = async (pid) => {
    if (isLocked) {
      toast.error('Комната защищена паролем.')
      return
    }
    const p = participants.find((x) => x.id === pid)
    if (!window.confirm(`Удалить ${p?.name || 'участника'}?`)) return
    setSaving(true)
    try {
      const res = await fetch(
        `/api/room/${id}/participant?participantId=${pid}`,
        { method: 'DELETE', headers: { ...getAuthHeaders() } }
      )
      if (await handleFetchError(res)) return
      if (res.ok) {
        setParticipants((prev) => prev.filter((p) => p.id !== pid))
        setSelectedIds((prev) => prev.filter((sid) => sid !== pid))
        if (selectedId === pid) setSelectedId('')
        if (payerId === pid) setPayerId('')
        if (sharedPayerId === pid) setSharedPayerId('')
        fetchLogs()
        toast.success(`${p?.name || 'Участник'} удалён`)
      } else {
        toast.error('Ошибка удаления')
      }
    } catch {
      toast.error('Ошибка удаления')
    } finally {
      setSaving(false)
    }
  }

  const updateName = (pid, name) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === pid ? { ...p, name } : p))
    )
  }

  const saveName = async (pid, name) => {
    if (isLocked) return
    try {
      const res = await fetch(`/api/room/${id}/participant`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ participantId: pid, name }),
      })
      if (await handleFetchError(res)) return
      toast.success('Имя сохранено')
    } catch {
      toast.error('Ошибка сохранения имени')
    }
  }

  const addToParticipant = async () => {
    if (isLocked) {
      toast.error('Комната защищена паролем.')
      return
    }
    if (!selectedId || individualAmount === '') {
      toast.error('Выберите участника и сумму')
      return
    }
    if (!payerId) {
      toast.error('Выберите, кто платил')
      return
    }
    const amount = parseFloat(individualAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Введите корректную сумму')
      return
    }
    const p = participants.find((x) => x.id === selectedId)
    const desc = `Начислено ${amount.toFixed(2)} ₽ участнику ${p?.name || ''}`
    setSaving(true)
    try {
      const res = await fetch(`/api/room/${id}/individual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          participantId: selectedId,
          amount,
          description: desc,
          note: individualNote,
          payerId,
        }),
      })
      if (await handleFetchError(res)) return
      if (res.ok) {
        setParticipants((prev) =>
          prev.map((pp) =>
            pp.id === selectedId
              ? { ...pp, amount: Math.round((pp.amount + amount) * 100) / 100 }
              : pp
          )
        )
        setIndividualAmount('')
        setIndividualNote('')
        setSelectedId('')
        setPayerId('')
        fetchLogs()
        toast.success(`Начислено ${amount.toFixed(2)} ₽`)
      } else {
        toast.error('Ошибка начисления')
      }
    } catch {
      toast.error('Ошибка начисления')
    } finally {
      setSaving(false)
    }
  }

  const distributeShared = async () => {
    if (isLocked) {
      toast.error('Комната защищена паролем.')
      return
    }
    if (sharedAmount === '' || selectedIds.length === 0) {
      toast.error('Введите сумму и выберите участников')
      return
    }
    if (!sharedPayerId) {
      toast.error('Выберите, кто платил')
      return
    }
    const amount = parseFloat(sharedAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Введите корректную сумму')
      return
    }

    const totalCents = Math.round(amount * 100)
    const count = selectedIds.length
    const baseCents = Math.floor(totalCents / count)
    let remainderCents = totalCents - baseCents * count

    const deltas = {}
    for (const pid of selectedIds) {
      let addCents = baseCents
      if (remainderCents > 0) {
        addCents += 1
        remainderCents -= 1
      }
      deltas[pid] = addCents / 100
    }

    const names = participants
      .filter((p) => selectedIds.includes(p.id))
      .map((p) => p.name)
      .join(', ')
    const desc = `Распределено ${amount.toFixed(2)} ₽ (${count} чел.: ${names})`

    setSaving(true)
    try {
      const res = await fetch(`/api/room/${id}/shared`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          amount,
          selectedIds,
          description: desc,
          note: sharedNote,
          payerId: sharedPayerId,
        }),
      })
      if (await handleFetchError(res)) return
      if (res.ok) {
        setParticipants((prev) =>
          prev.map((p) => {
            if (!selectedIds.includes(p.id)) return p
            const addAmount = deltas[p.id] || 0
            return {
              ...p,
              amount: Math.round((p.amount + addAmount) * 100) / 100,
            }
          })
        )
        setSharedAmount('')
        setSharedNote('')
        setSharedPayerId('')
        setSelectedIds([])
        fetchLogs()
        toast.success(`Распределено ${amount.toFixed(2)} ₽`)
      } else {
        toast.error('Ошибка распределения')
      }
    } catch {
      toast.error('Ошибка распределения')
    } finally {
      setSaving(false)
    }
  }

  const toggleSelectedId = (pid) => {
    setSelectedIds((prev) =>
      prev.includes(pid) ? prev.filter((i) => i !== pid) : [...prev, pid]
    )
  }
  const selectAll = () => setSelectedIds(participants.map((p) => p.id))
  const deselectAll = () => setSelectedIds([])

  const clearAll = async () => {
    if (isLocked) {
      toast.error('Комната защищена паролем.')
      return
    }
    if (!window.confirm('Точно очистить все данные? Это действие необратимо.'))
      return
    setSaving(true)
    try {
      const res = await fetch(`/api/room/${id}/clear`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
      })
      if (await handleFetchError(res)) return
      if (res.ok) {
        setParticipants([])
        setSelectedIds([])
        setSelectedId('')
        setIndividualAmount('')
        setIndividualNote('')
        setPayerId('')
        setSharedAmount('')
        setSharedNote('')
        setSharedPayerId('')
        fetchRoom()
        fetchLogs()
        toast.success('Все данные очищены')
      } else {
        toast.error('Ошибка очистки')
      }
    } catch {
      toast.error('Ошибка очистки')
    } finally {
      setSaving(false)
    }
  }

  const handleRollback = async (eventId) => {
    if (isLocked) {
      toast.error('Комната защищена паролем.')
      return
    }
    if (!window.confirm('Откатить эту операцию?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/room/${id}/events/${eventId}/revert`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
      })
      if (await handleFetchError(res)) return
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Не удалось откатить')
      } else {
        await fetchRoom()
        await fetchLogs()
        toast.success('Операция откачена')
      }
    } catch {
      toast.error('Ошибка сети при откате')
    } finally {
      setSaving(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => toast.success('Ссылка скопирована в буфер обмена!'))
      .catch(() => toast.error('Не удалось скопировать ссылку'))
  }

  const sharedPreview = (() => {
    if (sharedAmount === '' || selectedIds.length === 0) return null
    const amount = parseFloat(sharedAmount)
    if (isNaN(amount) || amount <= 0) return null
    const totalCents = Math.round(amount * 100)
    const count = selectedIds.length
    const baseCents = Math.floor(totalCents / count)
    let remainderCents = totalCents - baseCents * count
    return selectedIds.map((pid) => {
      let addCents = baseCents
      if (remainderCents > 0) {
        addCents += 1
        remainderCents -= 1
      }
      const p = participants.find((x) => x.id === pid)
      return { name: p?.name || 'Удалённый', amount: addCents / 100 }
    })
  })()

  const total = participants.reduce((sum, p) => sum + (p.amount || 0), 0)

  if (loading) {
    return <SkeletonRoom />
  }

  if (error) {
    return (
      <div
        className="container"
        style={{ textAlign: 'center', paddingTop: '80px' }}
      >
        <h1>Ошибка</h1>
        <p style={{ color: '#718096', marginBottom: '24px' }}>{error}</p>
        <button className="btn-primary" onClick={() => router.push('/')}>
          На главную
        </button>
      </div>
    )
  }

  return (
    <div className="container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <h1>Комната: {id}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {saving && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Сохранение...
            </span>
          )}
          <button
            className="theme-toggle btn-small"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
          >
            {theme === 'light' ? <IconMoon className="icon" /> : <IconSun className="icon" />}
          </button>
          {isProtected && (
            <>
              {isUnlocked ? (
                <button
                  className="btn-small btn-secondary"
                  onClick={lockRoom}
                  title="Заблокировать редактирование"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconLockOpen className="icon" /> Открыто
                </button>
              ) : (
                <button
                  className="btn-small btn-rollback"
                  onClick={() => setShowUnlockForm(!showUnlockForm)}
                  title="Разблокировать редактирование"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconLockClosed className="icon" /> Заблокировано
                </button>
              )}
            </>
          )}
          <button
            className="btn-secondary btn-small"
            onClick={copyLink}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <IconClipboard className="icon" /> Ссылка
          </button>
        </div>
      </div>

      {isProtected && !isUnlocked && showUnlockForm && (
        <div className="card unlock-card">
          <h3 className="unlock-title">
            <IconLockClosed className="icon" /> Введите пароль комнаты
          </h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div className="password-field" style={{ flex: 1, minWidth: '200px' }}>
              <IconLockClosed className="icon" />
              <input
                type={showUnlockPwd ? 'text' : 'password'}
                value={unlockPassword}
                onChange={(e) => { setUnlockPassword(e.target.value); setUnlockError('') }}
                placeholder="Пароль"
                onKeyDown={(e) => e.key === 'Enter' && tryUnlock()}
                autoFocus
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowUnlockPwd(!showUnlockPwd)}
                aria-label={showUnlockPwd ? 'Скрыть' : 'Показать'}
                title={showUnlockPwd ? 'Скрыть' : 'Показать'}
              >
                {showUnlockPwd ? <IconEyeOff className="icon" /> : <IconEye className="icon" />}
              </button>
            </div>
            <button className="btn-primary" onClick={tryUnlock}>Разблокировать</button>
          </div>
          {unlockError && (
            <p style={{ color: '#e53e3e', fontSize: '0.875rem', marginTop: '8px' }}>{unlockError}</p>
          )}
        </div>
      )}

      <div className="card">
        <h2>Участники</h2>
        {!isLocked && (
          <div className="form-row" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label>Имя</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Например, Алексей"
                onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                autoFocus={participants.length === 0}
              />
            </div>
            <button className="btn-primary" onClick={addParticipant}>Добавить</button>
          </div>
        )}
        {participants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">Пока нет участников</div>
            <div className="empty-subtitle">Добавьте первого, чтобы начать делить счёт</div>
          </div>
        ) : (
          <div className="participants-list">
            {participants.map((p) => (
              <div key={p.id} className="participant-item">
                {isLocked ? (
                  <span style={{ flex: 1, fontWeight: 500 }}>{p.name}</span>
                ) : (
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => updateName(p.id, e.target.value)}
                    onBlur={(e) => saveName(p.id, e.target.value)}
                  />
                )}
                <span className="participant-amount">{p.amount.toFixed(2)} ₽</span>
                {!isLocked && (
                  <button className="btn-secondary btn-small" onClick={() => removeParticipant(p.id)}>Удалить</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!isLocked && participants.length > 0 && (
        <>
          <div className="card">
            <h2>Накинуть сумму конкретному человеку</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Кому</label>
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                  <option value="">Выберите участника</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Кто платил</label>
                <select value={payerId} onChange={(e) => setPayerId(e.target.value)}>
                  <option value="">Выберите плательщика</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label>Сумма</label>
                <NumericFormat
                  value={individualAmount}
                  onValueChange={(values) => setIndividualAmount(values.value)}
                  placeholder="0.00"
                  allowNegative={false}
                  decimalScale={2}
                  suffix=" ₽"
                />
              </div>
              <button className="btn-primary" onClick={addToParticipant}>Добавить</button>
            </div>
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Примечание (за что)</label>
              <input
                type="text"
                value={individualNote}
                onChange={(e) => setIndividualNote(e.target.value)}
                placeholder="Например: За пиццу, такси, билеты"
                onKeyDown={(e) => e.key === 'Enter' && addToParticipant()}
              />
            </div>
          </div>


          <div className="card">
            <h2>Раскидать сумму между участниками</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Сумма для распределения</label>
                <NumericFormat
                  value={sharedAmount}
                  onValueChange={(values) => setSharedAmount(values.value)}
                  placeholder="0.00"
                  allowNegative={false}
                  decimalScale={2}
                  suffix=" ₽"
                />
              </div>
              <div className="form-group">
                <label>Кто платил</label>
                <select value={sharedPayerId} onChange={(e) => setSharedPayerId(e.target.value)}>
                  <option value="">Выберите плательщика</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Примечание (за что)</label>
              <input
                type="text"
                value={sharedNote}
                onChange={(e) => setSharedNote(e.target.value)}
                placeholder="Например: Общий чек в ресторане"
                onKeyDown={(e) => e.key === 'Enter' && distributeShared()}
              />
            </div>
            <div style={{ marginBottom: '12px', marginTop: '12px', display: 'flex', gap: '8px' }}>
              <button className="btn-secondary btn-small" onClick={selectAll}>Выбрать всех</button>
              <button className="btn-secondary btn-small" onClick={deselectAll}>Снять всех</button>
            </div>
            <div className="checkbox-grid">
              {participants.map((p) => (
                <label key={p.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => toggleSelectedId(p.id)}
                  />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>

            {sharedPreview && (
              <div className="preview-box">
                <div className="preview-title">Предпросмотр распределения:</div>
                {sharedPreview.map((item, idx) => (
                  <div key={idx} className="preview-row">
                    <span>{item.name}</span>
                    <span>+{item.amount.toFixed(2)} ₽</span>
                  </div>
                ))}
              </div>
            )}

            <button
              className="btn-primary"
              style={{ marginTop: '12px' }}
              onClick={distributeShared}
              disabled={selectedIds.length === 0}
            >
              Распределить поровну ({selectedIds.length} чел.)
            </button>
          </div>

        </>
      )}

      {participants.length > 0 && (
        <div className="card">
          <h2>Итого</h2>
          {participants.map((p) => (
            <div key={p.id} className="total-row">
              <span>{p.name}</span>
              <span>{p.amount.toFixed(2)} ₽</span>
            </div>
          ))}
          <div className="total-row">
            <span>Общая сумма</span>
            <span>{total.toFixed(2)} ₽</span>
          </div>
        </div>
      )}

      <div className="card">
        <h2>История операций</h2>
        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">Пока нет операций</div>
            <div className="empty-subtitle">Начислите или распределите сумму — записи появятся здесь</div>
          </div>
        ) : (
          <div className="logs-list">
            {logs.map((log) => (
              <div key={log.id} className={`log-item ${log.is_reverted ? 'rolled-back' : ''}`}>
                <div className="log-info">
                  <div className="log-date">
                    {new Date(log.created_at).toLocaleString('ru-RU')}
                    {log.is_reverted && ' · Откачено'}
                  </div>
                  <div className="log-desc">
                    {log.description}
                    {log.payer_name && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Платил: {log.payer_name}
                      </div>
                    )}
                    {log.note && <div className="log-note">Примечание: {log.note}</div>}
                    {log.entries && log.entries.length > 0 && (
                      <div className="log-entries">
                        {log.entries.map((entry, idx) => {
                          const name = participants.find((pp) => pp.id === entry.participant_id)?.name || 'Удалённый'
                          const d = parseFloat(entry.delta) || 0
                          const sign = d > 0 ? '+' : ''
                          return <span key={idx}>{name}: {sign}{d.toFixed(2)} ₽</span>
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span className="log-badge">{log.type}</span>
                  {!isLocked && !log.is_reverted && (log.type === 'individual' || log.type === 'shared') && (
                    <button className="btn-rollback btn-small" onClick={() => handleRollback(log.id)}>Откатить</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isLocked && (
        <div className="actions">
          <button className="btn-danger" onClick={clearAll}>Очистить всё</button>
        </div>
      )}
    </div>
  )
}
