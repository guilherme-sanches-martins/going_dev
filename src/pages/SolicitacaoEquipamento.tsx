import { useMemo, useState } from 'react'
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Equipamento, Periodo, ReservaItem } from '../types'
import MapaSVG from '../components/MapaSVG'
import { useReservasPorSlot } from '../hooks/useReservasPorSlot'
import { useEquipamentos } from '../hooks/useEquipamentos'

function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function SolicitacaoEquipamento() {
  // Estados principais
  const [tipoReserva, setTipoReserva] = useState<'sala' | 'equipamento' | 'ambos'>('ambos')
  const [data, setData] = useState<string>(iso(new Date()))
  const [hora, setHora] = useState<string>('')
  const [periodo, setPeriodo] = useState<Periodo>('matutino')
  const [bloco, setBloco] = useState<'B' | 'C' | 'D'>('B')
  const [salaId, setSalaId] = useState<string>('')
  const [equipamentoId, setEquipamentoId] = useState<string>('')
  const [localUso, setLocalUso] = useState<string>('') // novo campo
  const [solicitante, setSolicitante] = useState<string>('')

  // Firestore hooks
  const reservasFirestore = useReservasPorSlot(data, periodo)
  const equipamentosFirestore = useEquipamentos()

  // Salas reservadas
const salasReservadas = useMemo(
  () => reservasFirestore.map((r) => r.salaId).filter((id): id is string => !!id),
  [reservasFirestore]
)


  // Equipamentos disponíveis
  const equipamentosDisponiveis = useMemo<Equipamento[]>(() => {
    const ocupados = new Set(reservasFirestore.map((r) => r.equipamentoId))
    return equipamentosFirestore.filter(
      (eq) => eq.status === 'disponivel' && !ocupados.has(eq.id)
    )
  }, [equipamentosFirestore, reservasFirestore])

  // 🧭 Faixas de hora por período
  function getHoraRange(periodo: Periodo) {
    switch (periodo) {
      case 'matutino': return { min: '06:00', max: '12:00' }
      case 'vespertino': return { min: '12:00', max: '18:00' }
      case 'noturno': return { min: '18:00', max: '22:00' }
      default: return { min: '06:00', max: '22:00' }
    }
  }

  // Seleção no mapa
  function onSelectSalaFromMap(id: string) {
    setSalaId(id)
    let blocoDetectado: 'B' | 'C' | 'D' = 'B'
    const prefix = id[0]
    if (['B', 'C', 'D'].includes(prefix)) blocoDetectado = prefix as 'B' | 'C' | 'D'
    setBloco(blocoDetectado)
  }

  // Envio de solicitação
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!solicitante) {
      alert('Informe o nome do solicitante.')
      return
    }

    // Validações conforme tipo
    if (tipoReserva !== 'equipamento' && !salaId) {
      alert('Selecione uma sala.')
      return
    }
    if (tipoReserva !== 'sala' && !equipamentoId) {
      alert('Selecione um equipamento.')
      return
    }
    // Campo "Local de uso" opcional: não bloquear envio se vazio

    const { min, max } = getHoraRange(periodo)
    if (hora < min || hora > max) {
      alert(`A hora selecionada (${hora}) não corresponde ao período ${periodo}.`)
      return
    }

    try {
      // 🔎 Verifica conflito de sala
      if (tipoReserva !== 'equipamento') {
        const reservasRef = collection(db, 'reservas')
        const q = query(
          reservasRef,
          where('data', '==', data),
          where('periodo', '==', periodo),
          where('salaId', '==', salaId),
          where('hora', '==', hora)
        )

        const snapshot = await getDocs(q)
        if (!snapshot.empty) {
          alert('❌ Já existe uma reserva para esta sala neste horário.')
          return
        }
      }

      // ✅ Grava nova reserva
      const novaReserva: Omit<ReservaItem, 'id'> & {
        hora: string
        tipoReserva: string
        localUso?: string | null
      } = {
        tipoReserva,
        data,
        hora,
        periodo,
        bloco,
        salaId: tipoReserva !== 'equipamento' ? salaId : null,
        equipamentoId: tipoReserva !== 'sala' ? equipamentoId : null,
        localUso: tipoReserva !== 'sala' ? (localUso || null) : null,
        solicitante,
        status: 'pendente',
      }

      const docRef = await addDoc(collection(db, 'reservas'), novaReserva)
      console.log('Reserva criada com ID:', docRef.id)

      setEquipamentoId('')
      setSalaId('')
      setLocalUso('')
      setHora('')

      alert('✅ Solicitação enviada com sucesso!')
    } catch (error) {
      console.error('Erro ao verificar/salvar reserva:', error)
      alert('❌ Erro ao processar a solicitação no servidor.')
    }
  }

  // --- Render ---
  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      {/* Formulário */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold mb-1">
          Solicitação de Equipamento / Sala Audiovisual
        </h2>
        <p className="text-sm text-grayb-400 mb-6">
          Preencha os dados para reservar equipamentos e/ou salas
        </p>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Tipo de reserva */}
          <div>
            <label className="block text-sm text-grayb-400 mb-1">Tipo de reserva</label>
            <select
              value={tipoReserva}
              onChange={(e) => setTipoReserva(e.target.value as any)}
              className="select bg-grayb-50"
            >
              <option value="sala">Apenas Sala</option>
              <option value="equipamento">Apenas Equipamento</option>
              <option value="ambos">Sala + Equipamento</option>
            </select>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm text-grayb-400 mb-1">
              Nome do Solicitante *
            </label>
            <input
              value={solicitante}
              onChange={(e) => setSolicitante(e.target.value)}
              placeholder="Prof. João da Silva"
              className="input bg-grayb-50"
            />
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-grayb-400 mb-1">Data *</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="input bg-grayb-50"
              />
            </div>
            <div>
              <label className="block text-sm text-grayb-400 mb-1">Hora *</label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="input bg-grayb-50"
                min={getHoraRange(periodo).min}
                max={getHoraRange(periodo).max}
                step="1800"
              />
            </div>
          </div>

          {/* Período */}
          <div>
            <label className="block text-sm text-grayb-400 mb-1">Período *</label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as Periodo)}
              className="select bg-grayb-50"
            >
              <option value="matutino">Matutino (06h às 12h)</option>
              <option value="vespertino">Vespertino (12h às 18h)</option>
              <option value="noturno">Noturno (18h às 22h)</option>
            </select>
          </div>

          {/* Equipamento */}
          {(tipoReserva === 'equipamento' || tipoReserva === 'ambos') && (
            <>
              <div>
                <label className="block text-sm text-grayb-400 mb-1">
                  Equipamento (apenas disponíveis) *
                </label>
                <select
                  value={equipamentoId}
                  onChange={(e) => setEquipamentoId(e.target.value)}
                  className="select bg-grayb-50"
                >
                  <option value="">Selecione...</option>
                  {equipamentosDisponiveis.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.identificacao} — {eq.nome} ({eq.tipo}, Bloco {eq.bloco})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-grayb-400 mb-1">
                  Local de uso (se diferente da sala)
                </label>
                <input
                  value={localUso}
                  onChange={(e) => setLocalUso(e.target.value)}
                  className="input bg-grayb-50"
                  placeholder="Ex: Auditório C01"
                />
              </div>
            </>
          )}

          {/* Bloco + Sala */}
          {(tipoReserva === 'sala' || tipoReserva === 'ambos') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-grayb-400 mb-1">Bloco</label>
                <input value={bloco} readOnly className="input bg-grayb-50" />
              </div>
              <div>
                <label className="block text-sm text-grayb-400 mb-1">Sala</label>
                <input
                  value={salaId}
                  readOnly
                  placeholder="Clique no mapa"
                  className="input bg-grayb-50"
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-dark mt-2">
            Enviar Solicitação
          </button>
        </form>

        {/* Lista de reservas */}
        <div className="mt-6">
          <h3 className="font-medium mb-2">Reservas nessa data/período</h3>
          {reservasFirestore.length === 0 ? (
            <p className="text-grayb-400 text-sm">Nenhuma reserva.</p>
          ) : (
            <table className="w-full text-sm border-collapse mt-1">
              <thead>
                <tr className="text-left text-grayb-400 border-b border-grayb-100">
                  <th className="py-1">Sala</th>
                  <th>Hora</th>
                  <th>Equipamento</th>
                  <th>Solicitante</th>
                </tr>
              </thead>
              <tbody>
                {reservasFirestore.map((r) => {
                  const eq = equipamentosFirestore.find((e) => e.id === r.equipamentoId)
                  return (
                    <tr key={r.id} className="border-b border-grayb-100">
                      <td className="py-1">{r.salaId || '-'}</td>
                      <td>{(r as any).hora || '-'}</td>
                      <td>{eq ? `${eq.identificacao} — ${eq.nome}` : '—'}</td>
                      <td>{r.solicitante}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Mapa */}
      {(tipoReserva === 'sala' || tipoReserva === 'ambos') && (
        <section className="card p-4">
          <h3 className="font-medium mb-2">Mapa de Salas</h3>
          <p className="text-sm text-grayb-400 mb-3">
            Visualize a disponibilidade das salas
          </p>
          <MapaSVG
            salasReservadas={salasReservadas}
            onSelectSala={onSelectSalaFromMap}
          />
          <div className="flex items-center gap-4 text-sm mt-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-ok rounded-full"></span>Disponível
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-bad rounded-full"></span>Reservada
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
