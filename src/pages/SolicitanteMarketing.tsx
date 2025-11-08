import { useState } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../firebaseConfig'

type Aprovacao = { aprovado: boolean | null; por?: string; data?: string }

export default function SolicitanteMarketing() {
  const [solicitante, setSolicitante] = useState('')
  const [setorCurso, setSetorCurso] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [coordenador, setCoordenador] = useState(false)
  const [demanda, setDemanda] = useState<'acao' | 'campanha' | 'evento'>('acao')
  const [titulo, setTitulo] = useState('')
  const [data, setData] = useState('')
  const [horario, setHorario] = useState('')
  const [local, setLocal] = useState('')

  const [criacao, setCriacao] = useState<string[]>([])
  const [divulgacao, setDivulgacao] = useState<string[]>([])
  const [outros, setOutros] = useState<string[]>([])
  const [descricaoOutros, setDescricaoOutros] = useState('')

  const toggle = (grupo: string[], setGrupo: any, valor: string) => {
    if (grupo.includes(valor)) setGrupo(grupo.filter((v) => v !== valor))
    else setGrupo([...grupo, valor])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!solicitante || !setorCurso || !telefone || !email || !titulo || !data || !local) {
      alert('Preencha todos os campos obrigatórios.')
      return
    }

    const demandaFormatada = demanda
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase() as 'acao' | 'campanha' | 'evento'

    // ✅ Define estrutura de aprovações com tipo correto
    let aprovacoes: {
      coordenador: Aprovacao
      diretor: Aprovacao
      vice: Aprovacao
    } = {
      coordenador: { aprovado: null },
      diretor: { aprovado: null },
      vice: { aprovado: null },
    }

    // ✅ Se o solicitante for coordenador, pula a etapa do coordenador
    if (coordenador) {
      aprovacoes.coordenador = {
        aprovado: true,
        por: 'sistema',
        data: new Date().toISOString(),
      }
    }

    const payload = {
      solicitante,
      setorCurso,
      telefone,
      email,
      coordenador,
      demanda: demandaFormatada,
      titulo,
      data,
      horario: horario || null,
      local,
      criacao,
      divulgacao,
      outros,
      descricaoOutros,
      status: 'pendente',
      criadoEm: new Date().toISOString(),
      aprovacoes,
    }

    try {
      await addDoc(collection(db, 'marketing'), payload)
      alert('✅ Solicitação enviada e aguardando aprovação!')
      setSolicitante('')
      setSetorCurso('')
      setTelefone('')
      setEmail('')
      setCoordenador(false)
      setTitulo('')
      setData('')
      setHorario('')
      setLocal('')
      setCriacao([])
      setDivulgacao([])
      setOutros([])
      setDescricaoOutros('')
    } catch (err) {
      console.error('Erro ao enviar:', err)
      alert('❌ Erro ao enviar solicitação. Verifique as permissões no Firestore.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto card p-6">
      <h2 className="text-lg font-semibold mb-2">Solicitação — Marketing</h2>
      <p className="text-sm text-grayb-400 mb-4">
        Preencha os dados abaixo para solicitar apoio do setor de Marketing.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {/* Dados básicos */}
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">
            Solicitante*
            <input
              className="input mt-1"
              value={solicitante}
              onChange={(e) => setSolicitante(e.target.value)}
            />
          </label>

          <label className="text-sm">
            Setor/Curso*
            <input
              className="input mt-1"
              value={setorCurso}
              onChange={(e) => setSetorCurso(e.target.value)}
            />
          </label>

          <label className="text-sm">
            Telefone*
            <input
              className="input mt-1"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </label>

          <label className="text-sm">
            Email*
            <input
              className="input mt-1"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          {/* Checkbox Sou Coordenador */}
          <label className="flex items-center gap-2 text-sm md:col-span-2 mt-2">
            <input
              type="checkbox"
              checked={coordenador}
              onChange={(e) => setCoordenador(e.target.checked)}
            />
            Sou coordenador
          </label>
        </div>

        {/* Evento */}
        <div className="grid md:grid-cols-3 gap-4">
          <label className="text-sm">
            Demanda*
            <select
              className="select mt-1"
              value={demanda}
              onChange={(e) =>
                setDemanda(e.target.value as 'acao' | 'campanha' | 'evento')
              }
            >
              <option value="acao">Ação</option>
              <option value="campanha">Campanha</option>
              <option value="evento">Evento</option>
            </select>
          </label>

          <label className="text-sm">
            Data*
            <input
              type="date"
              className="input mt-1"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </label>

          <label className="text-sm">
            Horário (opcional)
            <input
              type="time"
              className="input mt-1"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
            />
          </label>
        </div>

        <label className="text-sm">
          Título*
          <input
            className="input mt-1"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </label>

        <label className="text-sm">
          Local*
          <input
            className="input mt-1"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
          />
        </label>

        {/* Criação de Peças */}
        <div>
          <h3 className="font-medium mt-3">Criação de Peças</h3>
          <div className="grid md:grid-cols-3 gap-2 mt-2">
            {[
              'Banner impresso 90x120',
              'Cartaz A4',
              'Cartaz A3',
              'Crachá 9x13',
              'Post online',
              'Email marketing',
            ].map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={criacao.includes(item)}
                  onChange={() => toggle(criacao, setCriacao, item)}
                />
                {item}
              </label>
            ))}
          </div>
        </div>

        {/* Divulgação */}
        <div>
          <h3 className="font-medium mt-3">Divulgação</h3>
          <div className="grid md:grid-cols-2 gap-2 mt-2">
            {[
              'Matéria para imprensa',
              'Matéria no site Univag',
              'Atualização de informação no site da Univag',
              'Divulgação de informação no site',
            ].map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={divulgacao.includes(item)}
                  onChange={() => toggle(divulgacao, setDivulgacao, item)}
                />
                {item}
              </label>
            ))}
          </div>
        </div>

        {/* Outros */}
        <div>
          <h3 className="font-medium mt-3">Outros</h3>
          <div className="grid md:grid-cols-2 gap-2 mt-2">
            {[
              'Fixação de banner/cartazes/faixas no campus',
              'Registro fotográfico',
              'Filmagem',
              'Outros',
            ].map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={outros.includes(item)}
                  onChange={() => toggle(outros, setOutros, item)}
                />
                {item}
              </label>
            ))}
          </div>
          {outros.includes('Outros') && (
            <input
              className="input mt-2"
              placeholder="Descreva o item 'Outros'..."
              value={descricaoOutros}
              onChange={(e) => setDescricaoOutros(e.target.value)}
            />
          )}
        </div>

        <button type="submit" className="btn btn-dark mt-4">
          Enviar Solicitação
        </button>
      </form>
    </div>
  )
}
