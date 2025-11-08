import { useState } from 'react'
import SolicitacaoEquipamento from './SolicitacaoEquipamento'
import SolicitanteMarketing from './SolicitanteMarketing'
import SolicitanteCerimonial from './SolicitanteCerimonial' // ✅ novo import

export default function Solicitante() {
  const [tab, setTab] = useState<'av' | 'mk' | 'ce'>('av')

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Cabeçalho */}
      <section className="lg:col-span-2">
        <h2 className="text-lg font-semibold">Painel do Solicitante</h2>
        <p className="text-sm text-grayb-400 -mt-1">
          Faça suas solicitações para os setores de Audiovisual, Marketing e Cerimonial.
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
        {tab === 'av' && (
          <div>
            <h3 className="font-medium mb-3">Solicitação — Audiovisual</h3>
            <SolicitacaoEquipamento />
          </div>
        )}

        {tab === 'mk' && (
          <div>
            <h3 className="font-medium mb-3">Solicitação — Marketing</h3>
            <SolicitanteMarketing />
          </div>
        )}

        {tab === 'ce' && (
          <div>
            <h3 className="font-medium mb-3">Solicitação — Cerimonial</h3>
            <SolicitanteCerimonial />
          </div>
        )}
      </div>
    </div>
  )
}
