import { useState, useMemo } from 'react'
import MapaSVG from '../components/MapaSVG'
import { useReservasPorSlot } from '../hooks/useReservasPorSlot'

export default function Colaboradores() {
  const [tab, setTab] = useState<'av' | 'mk' | 'ce'>('av')
  const [data, setData] = useState<string>(new Date().toISOString().slice(0, 10))
  const [periodo, setPeriodo] = useState<'todos' | 'matutino' | 'vespertino' | 'noturno'>('todos')

  const reservas = useReservasPorSlot(data, periodo)
  const salasReservadas = useMemo(() => reservas.map((r) => r.salaId), [reservas])

  return (
    <div className="flex flex-col gap-6">
      {/* Painel principal */}
      <section className="card p-4">
        <h3 className="font-semibold mb-2">Painel de Colaboradores</h3>
        <p className="text-sm text-grayb-400 -mt-1 mb-3">
          Gerencie as demandas por setor
        </p>

        <div className="tabs max-w-2xl mb-4">
          <button
            className={`tab ${tab === 'av' ? 'tab-active' : ''}`}
            onClick={() => setTab('av')}
          >
            Audiovisual
          </button>
          <button
            className={`tab ${tab === 'mk' ? 'tab-active' : ''}`}
            onClick={() => setTab('mk')}
          >
            Marketing
          </button>
          <button
            className={`tab ${tab === 'ce' ? 'tab-active' : ''}`}
            onClick={() => setTab('ce')}
          >
            Cerimonial
          </button>
        </div>

        {/* três colunas (como no Figma) */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium mb-2">Pendente</h4>
            <div className="text-grayb-400">Nenhuma reserva</div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Aprovado</h4>
            <div className="text-grayb-400">Nenhuma reserva</div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Recusado</h4>
            <div className="text-grayb-400">Nenhuma reserva</div>
          </div>
        </div>
      </section>

      {/* Mapa abaixo do painel */}
      <aside className="card p-4">
        <h3 className="font-semibold mb-1">Mapa de Salas</h3>
        <p className="text-sm text-grayb-400 -mt-1 mb-3">
          Visualize a disponibilidade por bloco
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <label className="text-sm col-span-2 md:col-span-2">
            Data
            <input
              type="date"
              className="input mt-1 w-full"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </label>
          <label className="text-sm col-span-2 md:col-span-2">
            Período
            <select
              className="select mt-1 w-full"
              value={periodo}
              onChange={(e) =>
                setPeriodo(e.target.value as 'todos' | 'matutino' | 'vespertino' | 'noturno')
              }
            >
              <option value="todos">Todos os períodos</option>
              <option value="matutino">Matutino</option>
              <option value="vespertino">Vespertino</option>
              <option value="noturno">Noturno</option>
            </select>
          </label>
        </div>

        {/* Mapa */}
        <div className="mb-3">
          <MapaSVG salasReservadas={salasReservadas} />
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-ok rounded-full"></span>Disponível
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-bad rounded-full"></span>Reservada
          </div>
        </div>
      </aside>
    </div>
  )
}
