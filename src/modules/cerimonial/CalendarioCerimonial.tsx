// src/modules/cerimonial/CalendarioCerimonial.tsx
import { useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

type Evento = {
  id: string
  titulo: string
  data: string
  horario: string
  local: string
}

const locales = { 'pt-BR': ptBR }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
})

export default function CalendarioCerimonial({ eventos }: { eventos: Evento[] }) {
  const [filtro, setFiltro] = useState('todos')

  const filtrados =
    filtro === 'todos'
      ? eventos
      : eventos.filter((e) => e.local.toLowerCase().includes(filtro.toLowerCase()))

  const dataEventos = filtrados.map((ev) => {
    const [hora, minuto] = ev.horario.split(':')
    const data = new Date(ev.data)
    data.setHours(parseInt(hora), parseInt(minuto))
    return {
      id: ev.id,
      title: `${ev.titulo} — ${ev.local}`,
      start: data,
      end: new Date(data.getTime() + 60 * 60 * 1000),
    }
  })

  function handleSelectSlot(slotInfo: any) {
    const dataSelecionada = slotInfo.start.toISOString().slice(0, 10)
    const hora = slotInfo.start.toTimeString().slice(0, 5)
    alert(`🆕 Novo evento em ${dataSelecionada} às ${hora}`)
  }

  return (
    <div className="card p-3">
      <div className="flex justify-between mb-3">
        <select
          className="select text-sm"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        >
          <option value="todos">Todos os locais</option>
          <option value="auditório b1">Auditório B1</option>
          <option value="auditório c3">Auditório C3</option>
        </select>

        <button
          className="btn btn-sm btn-dark"
          onClick={() => alert('🆕 abrir modal de novo evento')}
        >
          Novo Evento
        </button>
      </div>

      <div style={{ height: 500 }}>
        <Calendar
          localizer={localizer}
          events={dataEventos}
          startAccessor="start"
          endAccessor="end"
          selectable
          onSelectSlot={handleSelectSlot}
          popup
          messages={{
            next: 'Próximo',
            previous: 'Anterior',
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
          }}
          culture="pt-BR"
        />
      </div>

      {filtrados.length > 0 && (
        <ul className="text-sm grid gap-2 mt-4">
          {filtrados.map((ev) => (
            <li key={ev.id} className="border border-grayb-100 rounded-lg p-2">
              <b>{ev.titulo}</b> — {ev.local}
              <p className="text-xs text-grayb-400">
                {ev.data} às {ev.horario}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
