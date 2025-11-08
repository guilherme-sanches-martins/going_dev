import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import MapaSVG from '../components/MapaSVG'
import { useReservasPorSlot } from '../hooks/useReservasPorSlot'
import { useEquipamentos } from '../hooks/useEquipamentos'

export default function Colaboradores() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'av' | 'mk' | 'ce'>('av')
  const [data, setData] = useState<string>(new Date().toISOString().slice(0, 10))
  const [periodo, setPeriodo] = useState<'todos' | 'matutino' | 'vespertino' | 'noturno'>('todos')

  const reservas = useReservasPorSlot(data, periodo === 'todos' ? 'matutino' : periodo)
  const equipamentos = useEquipamentos()

  const salasReservadas = useMemo(() => reservas.map((r) => r.salaId), [reservas])

  const equipamentosEmUso = useMemo(() => {
    return reservas.map((r) => {
      const eq = equipamentos.find((e) => e.id === r.equipamentoId)
      return {
        sala: r.salaId,
        hora: (r as any).hora || '-',
        equipamento: eq ? eq.nome : '—',
        tipo: eq ? eq.tipo : '—',
        solicitante: r.solicitante,
      }
    })
  }, [reservas, equipamentos])

  return (
    <div className="flex flex-col gap-6">
      {/* Painel principal */}
      <section className="card p-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-semibold">Painel de Colaboradores</h3>
            <p className="text-sm text-grayb-400 -mt-1">
              Gerencie as demandas por setor
            </p>
          </div>

          {/* ✅ Botão só aparece na aba Audiovisual */}
          {tab === 'av' && (
            <button
              onClick={() => navigate('/colaborador/audiovisual')}
              className="btn btn-dark"
            >
              Gerenciar Equipamentos
            </button>
          )}
        </div>

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

        {/* Três colunas padrão (por enquanto mockadas) */}
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

      {/* Mapa + Lista */}
      <aside className="card p-4">
        <h3 className="font-semibold mb-1">Mapa de Salas</h3>
        <p className="text-sm text-grayb-400 -mt-1 mb-3">
          Visualize a disponibilidade e os equipamentos em uso
        </p>

        {/* Filtros */}
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
        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-ok rounded-full"></span>Disponível
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-bad rounded-full"></span>Reservada
          </div>
        </div>

        {/* Lista de equipamentos em uso */}
        <div className="mt-4">
          <h4 className="font-medium mb-2">Equipamentos em uso</h4>
          {equipamentosEmUso.length === 0 ? (
            <p className="text-grayb-400 text-sm">Nenhum equipamento reservado.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-grayb-400 border-b border-grayb-100">
                  <th className="py-1">Sala</th>
                  <th>Hora</th>
                  <th>Equipamento</th>
                  <th>Tipo</th>
                  <th>Solicitante</th>
                </tr>
              </thead>
              <tbody>
                {equipamentosEmUso.map((e, i) => (
                  <tr key={i} className="border-b border-grayb-100">
                    <td className="py-1">{e.sala}</td>
                    <td>{e.hora}</td>
                    <td>{e.equipamento}</td>
                    <td>{e.tipo}</td>
                    <td>{e.solicitante}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </aside>
    </div>
  )
}
