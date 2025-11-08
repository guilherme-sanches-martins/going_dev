import { useState, useMemo } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Periodo } from '../types'
import MapaSVG from '../components/MapaSVG'
import { useReservasPorSlot } from '../hooks/useReservasPorSlot'

// Função auxiliar
function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function SolicitanteCerimonial() {
  // Estados principais
  const [solicitante, setSolicitante] = useState('')
  const [titulo, setTitulo] = useState('')
  const [data, setData] = useState(iso(new Date()))
  const [horario, setHorario] = useState('')
  const [periodo, setPeriodo] = useState<Periodo>('matutino')
  const [local, setLocal] = useState('') // será preenchido pelo mapa
  const [itensAdicionais, setItensAdicionais] = useState('')

  // Reservas existentes para marcar salas no mapa
  const reservas = useReservasPorSlot(data, periodo)
  const salasReservadas = useMemo(
    () => reservas.map((r) => r.salaId).filter((id): id is string => !!id),
    [reservas]
  )

  // Seleção no mapa → define local automaticamente
  function onSelectSalaFromMap(id: string) {
    setLocal(id)
  }

  // Enviar solicitação
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!solicitante || !titulo || !data || !horario || !periodo || !local) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    const payload = {
      solicitante,
      titulo,
      data,
      horario,
      periodo,
      local,
      itensAdicionais,
      status: 'aberta',
      criadoEm: new Date().toISOString(),
    }

    try {
      await addDoc(collection(db, 'cerimonial'), payload)
      alert('✅ Solicitação enviada com sucesso!')

      // Resetar campos
      setSolicitante('')
      setTitulo('')
      setData(iso(new Date()))
      setHorario('')
      setPeriodo('matutino')
      setLocal('')
      setItensAdicionais('')
    } catch (err) {
      console.error('Erro ao enviar solicitação:', err)
      alert('❌ Erro ao enviar solicitação.')
    }
  }

  // --- Render ---
  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      {/* FORMULÁRIO */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold mb-1">Solicitação — Cerimonial</h2>
        <p className="text-sm text-grayb-400 mb-6">
          Preencha os dados para solicitar apoio do setor de Cerimonial.
        </p>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm">
              Nome do solicitante *
              <input
                className="input mt-1"
                value={solicitante}
                onChange={(e) => setSolicitante(e.target.value)}
              />
            </label>

            <label className="text-sm">
              Título do evento *
              <input
                className="input mt-1"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </label>

            <label className="text-sm">
              Data do evento *
              <input
                type="date"
                className="input mt-1"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </label>

            <label className="text-sm">
              Horário *
              <input
                type="time"
                className="input mt-1"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
              />
            </label>
          </div>

          <label className="text-sm">
            Período *
            <select
              className="select mt-1"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as Periodo)}
            >
              <option value="matutino">Matutino (06h às 12h)</option>
              <option value="vespertino">Vespertino (12h às 18h)</option>
              <option value="noturno">Noturno (18h às 22h)</option>
            </select>
          </label>

          <label className="text-sm">
            Local *
            <input
              className="input mt-1"
              value={local}
              readOnly
              placeholder="Selecione no mapa ao lado"
            />
          </label>

          <label className="text-sm">
            Itens adicionais (opcional)
            <input
              className="input mt-1"
              value={itensAdicionais}
              onChange={(e) => setItensAdicionais(e.target.value)}
            />
          </label>

          <button type="submit" className="btn btn-dark mt-2">
            Criar Evento e Gerar Checklist
          </button>
        </form>
      </section>

      {/* MAPA DE SALAS */}
      <section className="card p-4">
        <h3 className="font-medium mb-2">Mapa de Locais</h3>
        <p className="text-sm text-grayb-400 mb-3">
          Clique em uma sala para definir o local do evento
        </p>
        <MapaSVG salasReservadas={salasReservadas} onSelectSala={onSelectSalaFromMap} />
        <div className="flex items-center gap-4 text-sm mt-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-ok rounded-full"></span>Disponível
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-bad rounded-full"></span>Reservada
          </div>
        </div>
      </section>
    </div>
  )
}
