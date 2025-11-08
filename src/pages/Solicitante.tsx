import { useState } from 'react'
import SolicitacaoEquipamento from './SolicitacaoEquipamento'
import SolicitanteMarketing from './SolicitanteMarketing'

function CerimonialForm() {
  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-3">Solicitação de Cerimonial</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <input className="input" placeholder="Nome do solicitante *" />
        <input className="input" placeholder="Nome do evento *" />
        <input className="input" placeholder="Data do evento *" />
        <select className="select">
          <option>Período</option>
          <option>Matutino</option>
          <option>Vespertino</option>
          <option>Noturno</option>
        </select>
        <select className="select md:col-span-2">
          <option>Layout do ambiente</option>
        </select>
        <input
          className="input md:col-span-2"
          placeholder="Itens adicionais (opcional)"
        />
      </div>
      <button className="btn btn-dark mt-4">
        Criar Evento e Gerar Checklist
      </button>
    </div>
  )
}

export default function Solicitante() {
  const [tab, setTab] = useState<'av' | 'mk' | 'ce'>('av')

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Cabeçalho */}
      <section className="lg:col-span-2">
        <h2 className="text-lg font-semibold">Painel do Solicitante</h2>
        <p className="text-sm text-grayb-400 -mt-1">
          Faça suas solicitações para os setores de Audiovisual, Marketing e
          Cerimonial
        </p>
      </section>

      {/* Abas */}
      <div className="lg:col-span-2 card p-4">
        <div className="tabs max-w-lg mb-4">
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

        {/* Conteúdo das abas */}
        {tab === 'av' && <SolicitacaoEquipamento />}
        {tab === 'mk' && <SolicitanteMarketing />} {/* 👈 substituímos o antigo MarketingForm */}
        {tab === 'ce' && <CerimonialForm />}
      </div>
    </div>
  )
}
