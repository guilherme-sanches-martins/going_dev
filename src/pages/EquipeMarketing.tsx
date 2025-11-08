import { useState } from 'react'
import { useMarketingSolicitacoes } from '../hooks/useMarketingSolicitacoes'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'

export default function EquipeMarketing() {
  const solicitacoes = useMarketingSolicitacoes()
  const [atualizando, setAtualizando] = useState<string | null>(null)

  // Mostra apenas solicitações com status “em_andamento”
  const recebidas = solicitacoes.filter((s) => s.status === 'em_andamento')

  // Atualiza status de um item concluído
  async function toggleItemArray(id: string, grupo: 'criacao' | 'divulgacao' | 'outros', item: string) {
    setAtualizando(id)
    try {
      const ref = doc(db, 'marketing', id)
      // Cria um campo de apoio “concluidos”
      await updateDoc(ref, {
        [`${grupo}Concluidos.${item}`]: true
      })
    } catch (err) {
      console.error('Erro ao marcar item:', err)
      alert('Erro ao marcar item como concluído.')
    } finally {
      setAtualizando(null)
    }
  }

  // Define responsável (opcional)
  async function definirResponsavelArray(
    id: string,
    grupo: 'criacao' | 'divulgacao' | 'outros',
    item: string,
    nome: string
  ) {
    try {
      const ref = doc(db, 'marketing', id)
      await updateDoc(ref, { [`${grupo}Responsaveis.${item}`]: nome })
    } catch (err) {
      console.error('Erro ao salvar responsável:', err)
    }
  }

  // Concluir solicitação
  async function concluirSolicitacao(id: string) {
    if (!confirm('Deseja marcar a solicitação como concluída?')) return
    setAtualizando(id)
    try {
      const ref = doc(db, 'marketing', id)
      await updateDoc(ref, { status: 'concluida', concluidaEm: new Date().toISOString() })
    } catch (err) {
      console.error('Erro ao concluir solicitação:', err)
      alert('Erro ao concluir solicitação.')
    } finally {
      setAtualizando(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-2">Painel da Equipe de Marketing</h2>
      <p className="text-sm text-grayb-400 mb-4">
        Acompanhe e conclua as solicitações aprovadas pela vice-reitoria.
      </p>

      {recebidas.length === 0 ? (
        <div className="text-grayb-400 text-sm">Nenhuma solicitação recebida.</div>
      ) : (
        <div className="grid gap-5">
          {recebidas.map((s) => (
            <div key={s.id} className="card p-5 border border-grayb-100">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-medium text-lg">{s.titulo}</h3>
                  <p className="text-sm text-grayb-400">
                    Solicitante: {s.solicitante} — {s.data} {s.horario} — {s.local}
                  </p>
                </div>
                <button
                  onClick={() => concluirSolicitacao(s.id)}
                  disabled={atualizando === s.id}
                  className="btn btn-dark"
                >
                  {atualizando === s.id ? 'Salvando...' : 'Concluir Solicitação'}
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-5 mt-4">
                {(['criacao', 'divulgacao', 'outros'] as const).map((grupo) => {
                  const itens = (s as any)[grupo] || []
                  const concluidos = (s as any)[`${grupo}Concluidos`] || {}
                  const responsaveis = (s as any)[`${grupo}Responsaveis`] || {}

                  if (!Array.isArray(itens) || itens.length === 0) return null

                  return (
                    <div key={grupo}>
                      <h4 className="font-semibold mb-2 capitalize flex items-center gap-1">
                        {grupo === 'criacao'
                          ? '🖌️ Criação'
                          : grupo === 'divulgacao'
                          ? '📢 Divulgação'
                          : '🎯 Outros'}
                      </h4>

                      <div className="space-y-2">
                        {itens.map((item: string, i: number) => (
                          <label
                            key={i}
                            className={`flex flex-col border border-grayb-100 rounded-md p-2 ${
                              concluidos[item] ? 'bg-green-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!concluidos[item]}
                                  onChange={() => toggleItemArray(s.id, grupo, item)}
                                />
                                <span className="text-sm">{item}</span>
                              </div>
                              {concluidos[item] && (
                                <span className="text-xs text-green-600 font-medium">
                                  Concluído
                                </span>
                              )}
                            </div>

                            <input
                              type="text"
                              className="input input-xs mt-1"
                              placeholder="Responsável (opcional)"
                              defaultValue={responsaveis[item] || ''}
                              onBlur={(e) =>
                                definirResponsavelArray(s.id, grupo, item, e.target.value)
                              }
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
