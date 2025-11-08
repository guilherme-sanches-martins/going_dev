import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import MapaSVG from '../components/MapaSVG'
import CalendarioEventos, { CalEvent } from '../components/CalendarioEventos'
import { useReservasPorSlot } from '../hooks/useReservasPorSlot'
import { useEquipamentos } from '../hooks/useEquipamentos'
import { useMarketingSolicitacoes } from '../hooks/useMarketingSolicitacoes'
import CerimonialPainel from '../modules/cerimonial/CerimonialPainel'

export default function Colaboradores() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'av' | 'mk' | 'ce'>('av')
  const [data, setData] = useState<string>(new Date().toISOString().slice(0, 10))
  const [periodo, setPeriodo] = useState<'todos' | 'matutino' | 'vespertino' | 'noturno'>('todos')

  const reservas = useReservasPorSlot(data, periodo === 'todos' ? 'todos' : periodo)
  const equipamentos = useEquipamentos()
  const marketing = useMarketingSolicitacoes()

  // ----------- STATUS MK -----------
  const PENDENTES_SET = useMemo(() => new Set(['aberta', 'pendente']), [])
  const APROVADAS_SET = useMemo(() => new Set(['concluida', 'em_andamento']), [])
  const RECUSADAS_SET = useMemo(() => new Set(['recusada']), [])

  const pendentes = useMemo(() => marketing.filter(s => PENDENTES_SET.has(s.status as string)), [marketing])
  const aprovadas = useMemo(() => marketing.filter(s => APROVADAS_SET.has(s.status as string)), [marketing])
  const recusadas = useMemo(() => marketing.filter(s => RECUSADAS_SET.has(s.status as string)), [marketing])

  // ----------- APROVAÇÕES MK -----------
  async function aprovarEtapa(
    id: string,
    etapa: 'coordenador' | 'diretor' | 'vice',
    aprovado: boolean,
    por: string
  ) {
    try {
      const ref = doc(db, 'marketing', id)
      const base = `aprovacoes.${etapa}`
      const payload: any = {
        [`${base}.aprovado`]: aprovado,
        [`${base}.por`]: por,
        [`${base}.data`]: new Date().toISOString(),
      }

      if (!aprovado) payload.status = 'recusada'
      else if (etapa === 'vice') payload.status = 'em_andamento'
      else payload.status = 'pendente'

      await updateDoc(ref, payload)
      alert(`Etapa ${etapa} ${aprovado ? 'aprovada' : 'reprovada'} com sucesso!`)
    } catch (e) {
      console.error('Erro ao atualizar aprovação:', e)
      alert('Erro ao atualizar aprovação.')
    }
  }

  // ----------- EQUIPAMENTOS & SALAS -----------
  const salasReservadas = useMemo(() =>
    reservas.map(r => r.salaId).filter((id): id is string => !!id),
    [reservas]
  )

  const equipamentosEmUso = useMemo(() => {
    return reservas.map(r => {
      const eq = equipamentos.find(e => e.id === r.equipamentoId)
      return {
        sala: r.salaId || '—',
        hora: (r as any).hora || '-',
        equipamento: eq ? eq.nome : '—',
        tipo: eq ? eq.tipo : '—',
        solicitante: r.solicitante,
      }
    })
  }, [reservas, equipamentos])

  // ----------- CALENDÁRIO INTEGRADO -----------
  const eventosCalendario: CalEvent[] = useMemo(() => {
    const list: CalEvent[] = []

    // reservas do audiovisual
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

    // solicitações MK aprovadas
    marketing
      .filter(m => m.status === 'em_andamento' || m.status === 'concluida')
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

    return list
  }, [reservas, marketing])

  const [diaSelecionado, setDiaSelecionado] = useState<string>(new Date().toISOString().slice(0, 10))
  const eventosDoDia = useMemo(
    () => eventosCalendario.filter(e => e.date === diaSelecionado),
    [eventosCalendario, diaSelecionado]
  )

  // ----------- AGENDA AV (por horário) -----------
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

  // =====================================================
  // ====================== RENDER ========================
  // =====================================================
  return (
    <div className="flex flex-col gap-6">

      {/* ===================================================== */}
      {/* PAINEL PRINCIPAL */}
      {/* ===================================================== */}
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

        {/* BOTÃO EQUIPE MK */}
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

        {/* CONTEÚDO DE CADA ABA */}
        {tab === 'mk' ? (
          // ===================== MARKETING =====================
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
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* APROVADAS */}
            <div>
              <h4 className="font-medium mb-2">Aprovado</h4>
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
              <h4 className="font-medium mb-2">Recusado</h4>
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
        ) : tab === 'ce' ? (
          // ===================== CERIMONIAL =====================
          <div className="grid lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2">
              <CalendarioEventos
                events={eventosCalendario}
                title="Calendário de Eventos — Cerimonial"
                onDayChange={iso => setDiaSelecionado(iso)}
              />
            </div>

            {/* Checklist lateral */}
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
        ) : (
          // ===================== AUDIOVISUAL (sem calendário) =====================
          <div>
            <h4 className="font-medium mb-2">Agenda do dia — Audiovisual</h4>
            <p className="text-grayb-400 text-sm mb-3">
              Use o botão acima para gerenciar os equipamentos do setor.
            </p>
          </div>
        )}
      </section>

      {tab === 'av' && (
        <section className="card p-4">
          <div className="flex items-end gap-3 mb-3">
            <div>
              <h4 className="font-medium">Agenda do dia ?" Audiovisual</h4>
              <p className="text-sm text-grayb-400 -mt-1">Visualize salas e equipamentos por hor1rio</p>
            </div>
            <div className="ml-auto">
              <label className="text-sm">
                Data
                <input
                  type="date"
                  className="input ml-2"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="border rounded-xl">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-grayb-400 border-b border-grayb-100">
                  <th className="py-2 px-2 w-24">Hora</th>
                  <th className="px-2">Solicita15es (Sala/Equipamento/Solicitante)</th>
                  <th className="px-2 w-28">Status</th>
                  <th className="px-2 w-36">A15es</th>
                </tr>
              </thead>
              <tbody>
                {slotsDoDia.map((h) => {
                  const list = reservasPorHora.get(h) || []
                  return (
                    <tr key={h} className="border-b border-grayb-100 align-top">
                      <td className="py-2 px-2 text-grayb-500">{h}</td>
                      <td className="px-2">
                        {list.length === 0 ? (
                          <span className="text-grayb-300">—</span>
                        ) : (
                          <ul className="grid gap-1">
                            {list.map((r) => {
                              const eq = equipamentos.find((e) => e.id === r.equipamentoId)
                              const localUso = (r as any).localUso as string | null | undefined
                              return (
                                <li key={r.id} className="p-2 rounded bg-slate-50">
                                  <div>
                                    <b>{r.salaId || localUso || 'Local n1o definido'}</b>
                                    {eq && <span className="text-grayb-500"> — {eq.identificacao} · {eq.nome}</span>}
                                  </div>
                                  <div className="text-xs text-grayb-500">Solicitante: {r.solicitante}</div>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </td>
                      <td className="px-2">
                        {list.length === 0 ? null : (
                          <div className="grid gap-1">
                            {list.map((r) => (
                              <span key={r.id} className={`px-2 py-1 rounded text-xs inline-block ${
                                r.status === 'aprovado'
                                  ? 'bg-green-100 text-green-700'
                                  : (r as any).status === 'cancelado'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-grayb-100 text-grayb-600'
                              }`}>
                                {r.status}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-2">
                        {list.length === 0 ? null : (
                          <div className="grid gap-1">
                            {list.map((r) => (
                              <button
                                key={r.id}
                                className="btn btn-xs btn-outline"
                                disabled={r.status !== 'aprovado'}
                                onClick={() => cancelarReserva(r.id)}
                                title={r.status === 'aprovado' ? 'Cancelar reserva confirmada' : 'Dispon1vel apenas para confirmadas'}
                              >
                                Cancelar
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ===================================================== */}
      {/* MAPA E EQUIPAMENTOS */}
      {/* ===================================================== */}
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
