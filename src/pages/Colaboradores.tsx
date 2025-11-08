import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import MapaSVG from '../components/MapaSVG'
import CalendarioEventos, { CalEvent } from '../components/CalendarioEventos'
import { useReservasPorSlot } from '../hooks/useReservasPorSlot'
import { useEquipamentos } from '../hooks/useEquipamentos'
import { useMarketingSolicitacoes } from '../hooks/useMarketingSolicitacoes'
import { useCerimonialSolicitacoes } from '../hooks/useCerimonialSolicitacoes'

export default function Colaboradores() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'av' | 'mk' | 'ce'>('av')
  const [data, setData] = useState<string>(new Date().toISOString().slice(0, 10))
  const [periodo, setPeriodo] = useState<'todos' | 'matutino' | 'vespertino' | 'noturno'>('todos')

  const reservas = useReservasPorSlot(data, periodo === 'todos' ? 'matutino' : periodo)
  const equipamentos = useEquipamentos()
  const marketing = useMarketingSolicitacoes()
  const cerimonial = useCerimonialSolicitacoes()

  // ------------------------------------------------------
  // STATUS MARKETING
  const PENDENTES_SET = new Set(['aberta', 'pendente'])
  const APROVADAS_SET = new Set(['concluida', 'em_andamento'])
  const RECUSADAS_SET = new Set(['recusada'])

  const pendentes = marketing.filter(s => PENDENTES_SET.has(s.status as string))
  const aprovadas = marketing.filter(s => APROVADAS_SET.has(s.status as string))
  const recusadas = marketing.filter(s => RECUSADAS_SET.has(s.status as string))

  // ------------------------------------------------------
  // AÇÕES DE RESERVA
  async function cancelarReserva(id: string) {
    if (!confirm('Confirmar cancelamento desta reserva?')) return
    try {
      await updateDoc(doc(db, 'reservas', id), {
        status: 'cancelado',
        canceladoEm: new Date().toISOString(),
      } as any)
      alert('Reserva cancelada.')
    } catch (e) {
      console.error('Erro ao cancelar reserva:', e)
      alert('Erro ao cancelar reserva.')
    }
  }

  async function confirmarReserva(id: string) {
    try {
      await updateDoc(doc(db, 'reservas', id), {
        status: 'aprovado',
        aprovadoEm: new Date().toISOString(),
      } as any)
      alert('Reserva confirmada.')
    } catch (e) {
      console.error('Erro ao confirmar reserva:', e)
      alert('Erro ao confirmar reserva.')
    }
  }

  // ------------------------------------------------------
  // SALAS E EQUIPAMENTOS
  const salasReservadas = reservas.map(r => r.salaId).filter((id): id is string => !!id)

  const equipamentosEmUso = reservas.map(r => {
    const eq = equipamentos.find(e => e.id === r.equipamentoId)
    return {
      sala: r.salaId || '—',
      hora: (r as any).hora || '-',
      equipamento: eq ? eq.nome : '—',
      tipo: eq ? eq.tipo : '—',
      solicitante: r.solicitante,
      status: r.status,
      id: r.id,
    }
  })

  // ------------------------------------------------------
  // CALENDÁRIO INTEGRADO (AV + MK + CE)
  const eventosCalendario: CalEvent[] = useMemo(() => {
    const list: CalEvent[] = []

    // Audiovisual
    reservas.forEach(r => {
      list.push({
        id: `av-${r.id}`,
        date: r.data,
        time: (r as any).hora || undefined,
        title: `AV: ${r.solicitante} — ${r.salaId || 'Local não definido'}`,
        location: r.salaId || undefined,
        setor: 'av',
        status: r.status,
      })
    })

    // Marketing
    marketing
      .filter(m => ['em_andamento', 'concluida'].includes(m.status))
      .forEach(m => {
        list.push({
          id: `mk-${m.id}`,
          date: m.data,
          time: m.horario || undefined,
          title: `MK: ${m.titulo}`,
          location: m.local,
          setor: 'mk',
          status: m.status,
        })
      })

    // Cerimonial
    cerimonial
      .filter(c => ['aberta', 'em_andamento', 'concluida'].includes(c.status))
      .forEach(c => {
        list.push({
          id: `ce-${c.id}`,
          date: c.data,
          time: c.horario || undefined,
          title: `CE: ${c.titulo}`,
          location: c.local,
          setor: 'ce',
          status: c.status,
        })
      })

    return list
  }, [reservas, marketing, cerimonial])

  const [diaSelecionado, setDiaSelecionado] = useState<string>(new Date().toISOString().slice(0, 10))
  const eventosDoDia = eventosCalendario.filter(e => e.date === diaSelecionado)

  // ------------------------------------------------------
  // GERAÇÃO DE SLOTS (AGENDA AUDIOVISUAL)
  function gerarSlots(min: string, max: string, passoMin: number) {
    const [minH, minM] = min.split(':').map(Number)
    const [maxH, maxM] = max.split(':').map(Number)
    const inicio = minH * 60 + minM
    const fim = maxH * 60 + maxM
    const out: string[] = []
    for (let t = inicio; t <= fim; t += passoMin) {
      const h = Math.floor(t / 60).toString().padStart(2, '0')
      const m = (t % 60).toString().padStart(2, '0')
      out.push(`${h}:${m}`)
    }
    return out
  }

  const slotsDoDia = useMemo(() => gerarSlots('06:00', '22:00', 30), [])
  const reservasPorHora = useMemo(() => {
    const map = new Map<string, typeof reservas>()
    for (const r of reservas) {
      const hora = (r as any).hora as string | undefined
      if (!hora) continue
      const list = map.get(hora) || []
      list.push(r)
      map.set(hora, list)
    }
    return map
  }, [reservas])

  // ------------------------------------------------------
  // RENDER
  return (
    <div className="flex flex-col gap-6">
      {/* PAINEL PRINCIPAL */}
      <section className="card p-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-semibold">Painel de Colaboradores</h3>
            <p className="text-sm text-grayb-400 -mt-1">Gerencie as demandas por setor</p>
          </div>

          {tab === 'av' && (
            <button onClick={() => navigate('/colaborador/audiovisual')} className="btn btn-dark">
              Gerenciar Equipamentos
            </button>
          )}
        </div>

        {/* TABS */}
        <div className="tabs max-w-2xl mb-4">
          <button className={`tab ${tab === 'av' ? 'tab-active' : ''}`} onClick={() => setTab('av')}>Audiovisual</button>
          <button className={`tab ${tab === 'mk' ? 'tab-active' : ''}`} onClick={() => setTab('mk')}>Marketing</button>
          <button className={`tab ${tab === 'ce' ? 'tab-active' : ''}`} onClick={() => setTab('ce')}>Cerimonial</button>
        </div>

        {/* ===================== AUDIOVISUAL ===================== */}
        {tab === 'av' ? (
          <>
            <div className="mb-6">
              <h4 className="font-medium mb-2">Agenda do Dia — Audiovisual</h4>

              <div className="flex gap-4 mb-4">
                <label className="text-sm">
                  Data:
                  <input
                    type="date"
                    className="input ml-2"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                  />
                </label>

                <label className="text-sm">
                  Período:
                  <select
                    className="select ml-2"
                    value={periodo}
                    onChange={(e) =>
                      setPeriodo(e.target.value as 'todos' | 'matutino' | 'vespertino' | 'noturno')
                    }
                  >
                    <option value="todos">Todos</option>
                    <option value="matutino">Matutino</option>
                    <option value="vespertino">Vespertino</option>
                    <option value="noturno">Noturno</option>
                  </select>
                </label>
              </div>

              <div className="border rounded-xl overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left text-grayb-400 border-b border-grayb-100">
                      <th className="py-2 px-2 w-24">Hora</th>
                      <th className="px-2">Solicitações</th>
                      <th className="px-2 w-28">Status</th>
                      <th className="px-2 w-36">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slotsDoDia.map(h => {
                      const list = reservasPorHora.get(h) || []
                      return (
                        <tr key={h} className="border-b border-grayb-100 align-top">
                          <td className="py-2 px-2 text-grayb-500">{h}</td>
                          <td className="px-2">
                            {list.length === 0 ? (
                              <span className="text-grayb-300">—</span>
                            ) : (
                              <ul className="grid gap-1">
                                {list.map(r => {
                                  const eq = equipamentos.find(e => e.id === r.equipamentoId)
                                  const localUso = (r as any).localUso as string | null | undefined
                                  return (
                                    <li key={r.id} className="p-2 rounded bg-slate-50">
                                      <div>
                                        <b>{r.salaId || localUso || 'Local não definido'}</b>
                                        {eq && (
                                          <span className="text-grayb-500">
                                            {' '}– {eq.identificacao} – {eq.nome}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-grayb-500">
                                        Solicitante: {r.solicitante}
                                      </div>
                                    </li>
                                  )
                                })}
                              </ul>
                            )}
                          </td>

                          <td className="px-2">
                            {list.map(r => (
                              <span key={r.id} className={`px-2 py-1 rounded text-xs block mb-1 ${
                                r.status === 'aprovado'
                                  ? 'bg-green-100 text-green-700'
                                  : (r as any).status === 'cancelado'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-grayb-100 text-grayb-600'
                              }`}>
                                {r.status}
                              </span>
                            ))}
                          </td>

                          <td className="px-2">
                            {list.map(r => (
                              <div key={r.id} className="flex items-center gap-2 mb-1">
                                {r.status === 'pendente' && (
                                  <button
                                    className="btn btn-xs btn-dark"
                                    onClick={() => confirmarReserva(r.id)}
                                  >
                                    Confirmar
                                  </button>
                                )}
                                <button
                                  className="btn btn-xs btn-outline"
                                  disabled={r.status === 'cancelado'}
                                  onClick={() => cancelarReserva(r.id)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            ))}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : tab === 'mk' ? (
          /* ===================== MARKETING (com aprovações) ===================== */
          <div className="grid md:grid-cols-3 gap-4">
            {/* PENDENTE */}
            <div>
              <h4 className="font-medium mb-2">Pendente</h4>
              {pendentes.length === 0 ? (
                <p className="text-grayb-400 text-sm">Nenhuma solicitação</p>
              ) : (
                <ul className="text-sm grid gap-3">
                  {pendentes.map(p => (
                    <li key={p.id} className="border border-grayb-100 rounded-lg p-3">
                      <b>{p.titulo}</b> — {p.solicitante}
                      <div className="mt-2 text-xs text-grayb-600">
                        📅 {p.data} às {p.horario || '—'} | Local: {p.local}
                      </div>

                      {/* Etapas de aprovação */}
                      <div className="mt-3 border-t border-grayb-100 pt-2 text-sm">
                        {(['coordenador', 'diretor', 'vice'] as const).map(etapa => {
                          const info = (p.aprovacoes as any)?.[etapa]
                          const podeAgir =
                            (etapa === 'coordenador' && p.status !== 'recusada') ||
                            (etapa === 'diretor' && p.aprovacoes.coordenador?.aprovado) ||
                            (etapa === 'vice' && p.aprovacoes.diretor?.aprovado)

                          return (
                            <div key={etapa} className="flex items-center justify-between mb-1">
                              <div>
                                <b>
                                  {etapa === 'coordenador'
                                    ? 'Parecer do Coordenador'
                                    : etapa === 'diretor'
                                    ? 'Parecer do Diretor'
                                    : 'Parecer da Vice-Reitoria'}
                                </b>
                                <p className="text-xs text-grayb-400">
                                  {info?.aprovado === null || info?.aprovado === undefined
                                    ? 'Aguardando...'
                                    : info?.aprovado
                                    ? `✅ Aprovado por ${info.por}`
                                    : `❌ Reprovado por ${info.por}`}
                                </p>
                              </div>

                              {info?.aprovado == null && podeAgir && p.status !== 'recusada' && (
                                <div className="flex gap-2">
                                  <button
                                    className="btn btn-xs btn-dark"
                                    onClick={() => {
                                      const nome = prompt(`Quem está aprovando (${etapa})?`)
                                      if (nome)
                                        updateDoc(doc(db, 'marketing', p.id), {
                                          [`aprovacoes.${etapa}.aprovado`]: true,
                                          [`aprovacoes.${etapa}.por`]: nome,
                                          [`aprovacoes.${etapa}.data`]: new Date().toISOString(),
                                          status:
                                            etapa === 'vice' ? 'em_andamento' : 'pendente',
                                        }).then(() => alert('✅ Aprovado com sucesso!'))
                                    }}
                                  >
                                    Aprovar
                                  </button>
                                  <button
                                    className="btn btn-xs bg-red-100 text-red-600"
                                    onClick={() => {
                                      const nome = prompt(`Quem está reprovando (${etapa})?`)
                                      if (nome)
                                        updateDoc(doc(db, 'marketing', p.id), {
                                          [`aprovacoes.${etapa}.aprovado`]: false,
                                          [`aprovacoes.${etapa}.por`]: nome,
                                          [`aprovacoes.${etapa}.data`]: new Date().toISOString(),
                                          status: 'recusada',
                                        }).then(() => alert('❌ Reprovado com sucesso!'))
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

            {/* APROVADAS */}
            <div>
              <h4 className="font-medium mb-2">Aprovadas</h4>
              {aprovadas.length === 0 ? (
                <p className="text-grayb-400 text-sm">Nenhuma solicitação</p>
              ) : (
                <ul className="text-sm grid gap-1">
                  {aprovadas.map(a => (
                    <li key={a.id} className="border-b border-grayb-100 pb-1">
                      <b>{a.titulo}</b> — {a.solicitante}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* RECUSADAS */}
            <div>
              <h4 className="font-medium mb-2">Recusadas</h4>
              {recusadas.length === 0 ? (
                <p className="text-grayb-400 text-sm">Nenhuma solicitação</p>
              ) : (
                <ul className="text-sm grid gap-1">
                  {recusadas.map(r => (
                    <li key={r.id} className="border-b border-grayb-100 pb-1">
                      <b>{r.titulo}</b> — {r.solicitante}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          /* ===================== CERIMONIAL ===================== */
          <div className="grid lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2">
              <CalendarioEventos
                events={eventosCalendario}
                title="Calendário de Eventos — Cerimonial"
                onDayChange={iso => setDiaSelecionado(iso)}
              />
            </div>
            <aside className="card p-4">
              <h4 className="font-semibold mb-2">Checklist de Tarefas</h4>
              {eventosDoDia.length === 0 ? (
                <div className="text-sm text-grayb-400">Nenhum evento para exibir.</div>
              ) : (
                <ul className="text-sm space-y-2">
                  {eventosDoDia.map(ev => (
                    <li key={ev.id} className="p-2 rounded bg-slate-50">
                      <div><b>{ev.time || '--:--'}</b> — {ev.title}</div>
                      {ev.location && <div className="text-xs text-grayb-500">{ev.location}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        )}
      </section>

      {/* MAPA E EQUIPAMENTOS */}
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
              onChange={e => setData(e.target.value)}
            />
          </label>
          <label className="text-sm col-span-2 md:col-span-2">
            Período
            <select
              className="select mt-1 w-full"
              value={periodo}
              onChange={e =>
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
