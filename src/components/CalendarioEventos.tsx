import { useMemo, useState } from 'react'

export type CalEvent = {
  id: string
  date: string        // 'YYYY-MM-DD'
  time?: string       // 'HH:mm' (opcional)
  title: string
  location?: string
  setor?: 'av' | 'mk' | 'ce'
  status?: string
}

type ViewMode = 'month' | 'week' | 'day' | 'agenda'

type Props = {
  events: CalEvent[]
  title?: string
  onDayChange?: (dateISO: string) => void // opcional, para sincronizar “Checklist”
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay() // 0-dom, 1-seg...
  const diff = (day + 6) % 7 // segunda como início (0)
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function formatMonthTitle(date: Date) {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export default function CalendarioEventos({ events, title = 'Calendário de Eventos', onDayChange }: Props) {
  const [view, setView] = useState<ViewMode>('month')
  const [cursor, setCursor] = useState<Date>(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  })
  const [selectedDay, setSelectedDay] = useState<string>(toISODate(new Date()))

  // indexa eventos por dia
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>()
    for (const e of events) {
      const arr = map.get(e.date) || []
      arr.push(e)
      map.set(e.date, arr)
    }
    return map
  }, [events])

  function goToday() {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    setCursor(now)
    const iso = toISODate(now)
    setSelectedDay(iso)
    onDayChange?.(iso)
  }

  function goPrev() {
    const d = new Date(cursor)
    if (view === 'month') d.setMonth(d.getMonth() - 1)
    else if (view === 'week') d.setDate(d.getDate() - 7)
    else d.setDate(d.getDate() - 1)
    setCursor(d)
  }

  function goNext() {
    const d = new Date(cursor)
    if (view === 'month') d.setMonth(d.getMonth() + 1)
    else if (view === 'week') d.setDate(d.getDate() + 7)
    else d.setDate(d.getDate() + 1)
    setCursor(d)
  }

  function pickDay(d: Date) {
    const iso = toISODate(d)
    setSelectedDay(iso)
    onDayChange?.(iso)
  }

  // ---------- MONTH VIEW ----------
  function renderMonth() {
    const start = startOfMonth(cursor)
    const end = endOfMonth(cursor)

    // grade de 6x7 começando na segunda
    const gridStart = startOfWeek(start)
    const days: Date[] = []
    for (let i = 0; i < 42; i++) {
      days.push(addDays(gridStart, i))
    }

    return (
      <div className="border rounded-xl p-2">
        <div className="grid grid-cols-7 text-xs text-grayb-400 px-2 pb-1">
          {['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map((d) => (
            <div key={d} className="text-center uppercase tracking-wide">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-[2px]">
          {days.map((d) => {
            const iso = toISODate(d)
            const isThisMonth = d.getMonth() === cursor.getMonth()
            const has = eventsByDay.get(iso)?.length || 0
            const isSelected = iso === selectedDay

            return (
              <button
                key={iso}
                onClick={() => pickDay(d)}
                className={[
                  'h-24 text-left p-2 rounded-lg transition',
                  isSelected ? 'ring-2 ring-slate-300 bg-slate-50' : 'hover:bg-slate-50',
                  isThisMonth ? 'text-slate-700' : 'text-slate-300'
                ].join(' ')}
              >
                <div className="text-xs mb-1">{d.getDate().toString().padStart(2, '0')}</div>
                {has > 0 && (
                  <div className="text-[11px] inline-flex items-center gap-1 px-2 py-[2px] rounded-full bg-slate-900 text-white">
                    {has} evento{has > 1 ? 's' : ''}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ---------- WEEK VIEW ----------
  function renderWeek() {
    const start = startOfWeek(cursor)
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const iso = toISODate(d)
          const list = eventsByDay.get(iso) || []
          return (
            <div key={iso} className="border rounded-lg p-2">
              <div className="text-sm font-medium mb-1">
                {d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}
              </div>
              {list.length === 0 ? (
                <div className="text-xs text-grayb-400">Sem eventos</div>
              ) : (
                <ul className="text-xs space-y-1">
                  {list.map((e) => (
                    <li key={e.id} className="px-2 py-1 rounded bg-slate-50">
                      <b>{e.time || '--:--'}</b> — {e.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ---------- DAY VIEW ----------
  function renderDay() {
    const iso = toISODate(cursor)
    const list = eventsByDay.get(iso) || []
    return (
      <div className="border rounded-lg p-3">
        <div className="text-sm font-medium mb-2">
          {cursor.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </div>
        {list.length === 0 ? (
          <div className="text-sm text-grayb-400">Nenhum evento hoje.</div>
        ) : (
          <ul className="text-sm space-y-2">
            {list.map((e) => (
              <li key={e.id} className="p-2 rounded bg-slate-50">
                <div><b>{e.time || '--:--'}</b> — {e.title}</div>
                {e.location && <div className="text-xs text-grayb-500">{e.location}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  // ---------- AGENDA VIEW ----------
  function renderAgenda() {
    // 14 dias corridos
    const start = startOfWeek(cursor)
    const days = Array.from({ length: 14 }, (_, i) => addDays(start, i))
    return (
      <div className="space-y-2">
        {days.map((d) => {
          const iso = toISODate(d)
          const list = eventsByDay.get(iso) || []
          return (
            <div key={iso} className="border rounded-lg p-2">
              <div className="text-xs font-medium text-grayb-500 mb-1">
                {d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
              </div>
              {list.length === 0 ? (
                <div className="text-xs text-grayb-400">—</div>
              ) : (
                <ul className="text-sm space-y-1">
                  {list.map((e) => (
                    <li key={e.id} className="px-2 py-1 rounded bg-slate-50">
                      <b>{e.time || '--:--'}</b> — {e.title}
                      {e.location && <span className="text-xs text-grayb-500"> • {e.location}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-grayb-400 -mt-1">{formatMonthTitle(cursor)}</p>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2">
          <button className="btn btn-outline" onClick={goToday}>Hoje</button>
          <button className="btn" onClick={goPrev}>Anterior</button>
          <button className="btn" onClick={goNext}>Próximo</button>

          <div className="tabs ml-2">
            <button className={`tab ${view === 'month' ? 'tab-active' : ''}`} onClick={() => setView('month')}>Mês</button>
            <button className={`tab ${view === 'week' ? 'tab-active' : ''}`} onClick={() => setView('week')}>Semana</button>
            <button className={`tab ${view === 'day' ? 'tab-active' : ''}`} onClick={() => setView('day')}>Dia</button>
            <button className={`tab ${view === 'agenda' ? 'tab-active' : ''}`} onClick={() => setView('agenda')}>Agenda</button>
          </div>
        </div>
      </div>

      {view === 'month' && renderMonth()}
      {view === 'week' && renderWeek()}
      {view === 'day' && renderDay()}
      {view === 'agenda' && renderAgenda()}
    </section>
  )
}
