import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import MapaSVG from '../components/MapaSVG'
import { useReservasPorSlot } from '../hooks/useReservasPorSlot'
import { useEquipamentos } from '../hooks/useEquipamentos'
import { useMarketingSolicitacoes } from '../hooks/useMarketingSolicitacoes'

export default function Colaboradores() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'av' | 'mk' | 'ce'>('av')
  const [data, setData] = useState<string>(new Date().toISOString().slice(0, 10))
  const [periodo, setPeriodo] = useState<'todos' | 'matutino' | 'vespertino' | 'noturno'>('todos')

  const reservas = useReservasPorSlot(data, periodo === 'todos' ? 'matutino' : periodo)
  const equipamentos = useEquipamentos()
  const marketing = useMarketingSolicitacoes()

  const PENDENTES_SET = useMemo(() => new Set<string>(['aberta', 'pendente']), [])
  const APROVADAS_SET = useMemo(() => new Set<string>(['concluida', 'em_andamento']), [])
  const RECUSADAS_SET = useMemo(() => new Set<string>(['recusada']), [])

  const pendentes = useMemo(
    () => marketing.filter((s) => PENDENTES_SET.has((s.status as unknown) as string)),
    [marketing]
  )
  const aprovadas = useMemo(
    () => marketing.filter((s) => APROVADAS_SET.has((s.status as unknown) as string)),
    [marketing]
  )
  const recusadas = useMemo(
    () => marketing.filter((s) => RECUSADAS_SET.has((s.status as unknown) as string)),
    [marketing]
  )

  async function aprovarEtapa(
    id: string,
    etapa: 'coordenador' | 'diretor' | 'vice',
    aprovado: boolean,
    por: string
  ) {
    try {
      const ref = doc(db, 'marketing', id)
      const fieldBase = `aprovacoes.${etapa}`
      const payload: any = {
        [`${fieldBase}.aprovado`]: aprovado,
        [`${fieldBase}.por`]: por,
        [`${fieldBase}.data`]: new Date().toISOString(),
      }

      if (!aprovado) {
        payload['status'] = 'recusada'
      } else if (etapa === 'vice') {
        payload['status'] = 'em_andamento'
      } else {
        payload['status'] = 'pendente'
      }

      await updateDoc(ref, payload)
      alert(`Etapa ${etapa} ${aprovado ? 'aprovada' : 'reprovada'} com sucesso!`)
    } catch (err) {
      console.error('Erro ao atualizar aprovação:', err)
      alert('Erro ao atualizar aprovação.')
    }
  }

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
      <section className="card p-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-semibold">Painel de Colaboradores</h3>
            <p className="text-sm text-grayb-400 -mt-1">Gerencie as demandas por setor</p>
          </div>

          {tab === 'av' && (
            <button
              onClick={() => navigate('/colaborador/audiovisual')}
              className="btn btn-dark"
            >
              Gerenciar Equipamentos
            </button>
          )}
        </div>

        {/* Tabs */}
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

        {/* ✅ Botão para a equipe de marketing */}
        {tab === 'mk' && (
          <div className="mb-5 flex justify-end">
            <button
              onClick={() => navigate('/equipe/marketing')}
              className="btn btn-dark hover:brightness-110 transition"
            >
              📋 Acessar Painel da Equipe de Marketing
            </button>
          </div>
        )}

        {/* Conteúdo Marketing */}
        {tab === 'mk' ? (
          <div className="grid md:grid-cols-3 gap-4">
            {/* Pendente */}
            <div>
              <h4 className="font-medium mb-2">Pendente</h4>
              {pendentes.length === 0 ? (
                <div className="text-grayb-400 text-sm">Nenhuma solicitação</div>
              ) : (
                <ul className="text-sm grid gap-3">
                  {pendentes.map((p) => (
                    <li key={p.id} className="border border-grayb-100 rounded-lg p-3">
                      <b>{p.titulo}</b> — {p.solicitante}
                      <div className="mt-2 grid gap-1 text-xs text-grayb-600">
                        <p>📅 {p.data} às {p.horario || '—'} | Local: {p.local}</p>
                        <p>Setor: {p.setorCurso}</p>
                      </div>

                      <div className="mt-3 border-t border-grayb-100 pt-2 text-sm">
                        {(['coordenador', 'diretor', 'vice'] as const).map((etapa) => {
                          const info = (p.aprovacoes as any)?.[etapa]

                          const podeAgir =
                            (etapa === 'coordenador' && p.status !== 'recusada') ||
                            (etapa === 'diretor' && p.aprovacoes.coordenador.aprovado === true) ||
                            (etapa === 'vice' && p.aprovacoes.diretor.aprovado === true)

                          return (
                            <div
                              key={etapa}
                              className="flex items-center justify-between mb-1"
                            >
                              <div>
                                <b>
                                  {etapa === 'coordenador'
                                    ? 'Parecer do Coordenador'
                                    : etapa === 'diretor'
                                    ? 'Parecer do Diretor'
                                    : 'Parecer da Vice-Reitoria'}
                                </b>
                                <p className="text-xs text-grayb-400">
                                  {info?.aprovado === null
                                    ? 'Aguardando...'
                                    : info?.aprovado
                                    ? `✅ Aprovado por ${info.por}`
                                    : `❌ Reprovado por ${info.por}`}
                                </p>
                              </div>

                              {info?.aprovado === null && podeAgir && p.status !== 'recusada' && (
                                <div className="flex gap-2">
                                  <button
                                    className="btn btn-xs btn-dark"
                                    onClick={() => {
                                      const nome = prompt(`Quem está aprovando (${etapa})?`)
                                      if (nome) aprovarEtapa(p.id, etapa, true, nome)
                                    }}
                                  >
                                    Aprovar
                                  </button>
                                  <button
                                    className="btn btn-xs bg-red-100 text-red-600"
                                    onClick={() => {
                                      const nome = prompt(`Quem está reprovando (${etapa})?`)
                                      if (nome) aprovarEtapa(p.id, etapa, false, nome)
                                    }}
                                  >
                                    Reprovar
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Aprovado */}
            <div>
              <h4 className="font-medium mb-2">Aprovado</h4>
              {aprovadas.length === 0 ? (
                <div className="text-grayb-400 text-sm">Nenhuma solicitação</div>
              ) : (
                <ul className="text-sm grid gap-1">
                  {aprovadas.map((a) => (
                    <li key={a.id} className="border-b border-grayb-100 pb-1">
                      <b>{a.titulo}</b> — {a.solicitante}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Recusado */}
            <div>
              <h4 className="font-medium mb-2">Recusado</h4>
              {recusadas.length === 0 ? (
                <div className="text-grayb-400 text-sm">Nenhuma solicitação</div>
              ) : (
                <ul className="text-sm grid gap-1">
                  {recusadas.map((r) => (
                    <li key={r.id} className="border-b border-grayb-100 pb-1">
                      <b>{r.titulo}</b> — {r.solicitante}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
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
        )}
      </section>

      {/* Mapa + Lista mantidos */}
      <aside className="card p-4">
        <h3 className="font-semibold mb-1">Mapa de Salas</h3>
        <p className="text-sm text-grayb-400 -mt-1 mb-3">
          Visualize a disponibilidade e os equipamentos em uso
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

        <div className="mb-3">
          <MapaSVG salasReservadas={salasReservadas} />
        </div>

        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-ok rounded-full"></span>Disponível
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-bad rounded-full"></span>Reservada
          </div>
        </div>

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
