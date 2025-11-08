import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { useMarketingSolicitacoes } from '../hooks/useMarketingSolicitacoes'
import { MarketingSolicitacao } from '../types'
import { useState } from 'react'

type ItemPath = { grupo:'criacao'|'divulgacao'|'outros', key:string }

export default function ColaboradorMarketing() {
  const itens = useMarketingSolicitacoes()
  const [salvando, setSalvando] = useState<string|undefined>()

  async function atualizarChecklist(s: MarketingSolicitacao, path: ItemPath, patch: Partial<{concluido:boolean; responsavel:string}>) {
    const ref = doc(db, 'marketing', s.id)
    const fieldDone = `${path.grupo}.${path.key}.concluido`
    const fieldResp = `${path.grupo}.${path.key}.responsavel`
    const payload:any = {}
    if (patch.concluido !== undefined) payload[fieldDone] = patch.concluido
    if (patch.responsavel !== undefined) payload[fieldResp] = patch.responsavel
    setSalvando(s.id)
    try {
      await updateDoc(ref, payload)
    } finally {
      setSalvando(undefined)
    }
  }

  async function marcarSolicitacaoConcluida(s: MarketingSolicitacao) {
    const ref = doc(db, 'marketing', s.id)
    await updateDoc(ref, { status:'concluida', concluidaEm: new Date().toISOString() })
  }

  const grupos: { titulo:string, grupo: ItemPath['grupo'], itens: [keyof MarketingSolicitacao['criacao']|keyof MarketingSolicitacao['divulgacao']|keyof MarketingSolicitacao['outros'], string][] }[] = [
    { titulo:'Criação de peças', grupo:'criacao', itens:[
      ['banner90x120','Banner 90x120'], ['cartazA4','Cartaz A4'], ['cartazA3','Cartaz A3'],
      ['cracha9x13','Crachá 9x13'], ['postOnline','Post online'], ['emailMkt','Email marketing']
    ]},
    { titulo:'Divulgação', grupo:'divulgacao', itens:[
      ['materiaImprensa','Matéria para imprensa'], ['materiaSite','Matéria no site'],
      ['attSite','Atualização no site'], ['divulgacaoSite','Divulgação no site']
    ]},
    { titulo:'Outros', grupo:'outros', itens:[
      ['fixacaoCampus','Fixação no campus'], ['registroFoto','Registro fotográfico'],
      ['filmagem','Filmagem'], ['outros','Outros']
    ]},
  ]

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Colaborador — Marketing</h2>

      {itens.length===0 ? (
        <div className="card p-4 text-grayb-400 text-sm">Nenhuma solicitação.</div>
      ) : (
        <div className="grid gap-6">
          {itens.map((s)=>(
            <div key={s.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium">{s.titulo}</h3>
                  <p className="text-sm text-grayb-400 -mt-1">
                    {s.demanda.toUpperCase()} • {s.data} {s.horario} • {s.local} • Solicitante: {s.solicitante} ({s.setorCurso})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${s.status==='concluida'?'bg-green-100 text-green-700': s.status==='em_andamento'?'bg-yellow-100 text-yellow-700':'bg-grayb-100 text-grayb-500'}`}>
                    {s.status}
                  </span>
                  {s.status!=='concluida' && (
                    <button className="btn btn-dark" onClick={()=>marcarSolicitacaoConcluida(s)}>Concluir solicitação</button>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-4">
                {grupos.map(g=>(
                  <div key={g.grupo} className="border border-grayb-100 rounded-xl2 p-3">
                    <h4 className="font-medium mb-2">{g.titulo}</h4>
                    <div className="grid gap-2">
                      {g.itens.map(([key,label])=>{
                        const item = (s as any)[g.grupo][key] as {solicitado:boolean; concluido:boolean; responsavel?:string}
                        if (!item?.solicitado) return (
                          <div key={String(key)} className="text-sm text-grayb-300">{label} — não solicitado</div>
                        )
                        return (
                          <div key={String(key)} className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!!item.concluido}
                                onChange={(e)=>atualizarChecklist(s,{grupo:g.grupo,key:String(key)}, {concluido: e.target.checked})}
                              />
                              <span className="text-sm">{label}</span>
                            </div>
                            <input
                              className="input py-1"
                              placeholder="Responsável (ex.: Maria)"
                              value={item.responsavel || ''}
                              onChange={(e)=>atualizarChecklist(s,{grupo:g.grupo,key:String(key)},{responsavel: e.target.value})}
                            />
                          </div>
                        )
                      })}
                      {g.grupo==='outros' && (s.outros.outros?.solicitado) && (
                        <p className="text-xs text-grayb-400 mt-1">
                          Detalhe “Outros”: {s.outros.descricaoOutros || '—'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {salvando===s.id && <div className="text-xs text-grayb-400 mt-2">Salvando…</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
