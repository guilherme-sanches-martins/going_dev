import { useState, useRef } from 'react'
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { useEquipamentos } from '../hooks/useEquipamentos'
import { Equipamento } from '../types'

export default function AdminAudiovisual() {
  const equipamentos = useEquipamentos()
  const jaIniciado = useRef(false) // 🔒 Evita execução automática no primeiro render

  const [novo, setNovo] = useState<Omit<Equipamento, 'id'>>({
    identificacao: '',
    nome: '',
    tipo: 'Datashow',
    bloco: 'B',
    status: 'disponivel',
  })
  const [editando, setEditando] = useState<string | null>(null)

  // 🔹 Adicionar novo equipamento
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()

    // 🔒 Evita que React StrictMode / hot reload executem automaticamente
    if (!jaIniciado.current) {
      jaIniciado.current = true
      return
    }

    if (!novo.identificacao.trim() || !novo.nome.trim()) {
      alert('Informe a identificação e o nome do equipamento.')
      return
    }

    try {
      await addDoc(collection(db, 'equipamentos'), novo)
      setNovo({
        identificacao: '',
        nome: '',
        tipo: 'Datashow',
        bloco: 'B',
        status: 'disponivel',
      })
      alert('✅ Equipamento adicionado com sucesso!')
    } catch (err) {
      console.error('Erro ao adicionar:', err)
      alert('❌ Erro ao salvar equipamento.')
    }
  }

  // 🔹 Alternar status (disponível ↔ manutenção)
  async function toggleStatus(equip: Equipamento) {
    try {
      const ref = doc(db, 'equipamentos', equip.id)
      const novoStatus = equip.status === 'disponivel' ? 'manutencao' : 'disponivel'
      await updateDoc(ref, { status: novoStatus })
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  // 🔹 Atualizar nome/tipo/bloco/identificação
  async function handleSave(equip: Equipamento) {
    try {
      const ref = doc(db, 'equipamentos', equip.id)
      await updateDoc(ref, {
        identificacao: equip.identificacao,
        nome: equip.nome,
        tipo: equip.tipo,
        bloco: equip.bloco,
      })
      setEditando(null)
    } catch (err) {
      console.error('Erro ao salvar edição:', err)
    }
  }

  // 🔹 Excluir
  async function handleDelete(id: string) {
    if (!confirm('Excluir este equipamento?')) return
    try {
      await deleteDoc(doc(db, 'equipamentos', id))
    } catch (err) {
      console.error('Erro ao excluir:', err)
    }
  }

  // --- Render ---
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Painel Administrativo — Audiovisual</h2>
      <p className="text-grayb-400 mb-6">
        Gerencie o inventário de equipamentos disponíveis para reserva.
      </p>

      {/* Formulário de novo equipamento */}
      <form
        onSubmit={handleAdd}
        noValidate
        className="card p-4 mb-6 grid md:grid-cols-5 gap-4 items-end"
      >
        <label className="text-sm">
          Identificação
          <input
            className="input mt-1"
            placeholder="INV-001"
            value={novo.identificacao}
            onChange={(e) => setNovo({ ...novo, identificacao: e.target.value })}
          />
        </label>

        <label className="text-sm md:col-span-2">
          Nome
          <input
            className="input mt-1"
            placeholder="Datashow Epson X1000"
            value={novo.nome}
            onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
          />
        </label>

        <label className="text-sm">
          Tipo
          <select
            className="select mt-1"
            value={novo.tipo}
            onChange={(e) =>
              setNovo({ ...novo, tipo: e.target.value as Equipamento['tipo'] })
            }
          >
            <option>Datashow</option>
            <option>Notebook</option>
            <option>Microfone</option>
            <option>Caixa de som</option>
          </select>
        </label>

        <label className="text-sm">
          Bloco
          <select
            className="select mt-1"
            value={novo.bloco}
            onChange={(e) =>
              setNovo({ ...novo, bloco: e.target.value as 'B' | 'C' | 'D' })
            }
          >
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </label>

        <button type="submit" className="btn btn-dark h-10 mt-5">
          Adicionar
        </button>
      </form>

      {/* Lista de equipamentos */}
      <section className="card p-4">
        <h3 className="font-medium mb-3">Inventário Atual</h3>
        {equipamentos.length === 0 ? (
          <p className="text-grayb-400 text-sm">Nenhum equipamento cadastrado.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-grayb-400 border-b border-grayb-100">
                <th className="py-1">ID Inventário</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Bloco</th>
                <th>Status</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {equipamentos.map((eq) => (
                <tr key={eq.id} className="border-b border-grayb-100">
                  <td className="py-1">
                    {editando === eq.id ? (
                      <input
                        className="input py-1"
                        value={eq.identificacao}
                        onChange={(e) => (eq.identificacao = e.target.value)}
                      />
                    ) : (
                      eq.identificacao
                    )}
                  </td>
                  <td>
                    {editando === eq.id ? (
                      <input
                        className="input py-1"
                        value={eq.nome}
                        onChange={(e) => (eq.nome = e.target.value)}
                      />
                    ) : (
                      eq.nome
                    )}
                  </td>
                  <td>
                    {editando === eq.id ? (
                      <select
                        className="select py-1"
                        value={eq.tipo}
                        onChange={(e) =>
                          (eq.tipo = e.target.value as Equipamento['tipo'])
                        }
                      >
                        <option>Datashow</option>
                        <option>Notebook</option>
                        <option>Microfone</option>
                        <option>Caixa de som</option>
                      </select>
                    ) : (
                      eq.tipo
                    )}
                  </td>
                  <td>
                    {editando === eq.id ? (
                      <select
                        className="select py-1"
                        value={eq.bloco}
                        onChange={(e) =>
                          (eq.bloco = e.target.value as 'B' | 'C' | 'D')
                        }
                      >
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    ) : (
                      eq.bloco
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggleStatus(eq)}
                      className={`px-2 py-1 rounded text-xs ${
                        eq.status === 'disponivel'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {eq.status === 'disponivel'
                        ? 'Disponível'
                        : 'Manutenção'}
                    </button>
                  </td>
                  <td className="text-center">
                    {editando === eq.id ? (
                      <button
                        type="button"
                        className="text-blue-600 hover:underline text-xs"
                        onClick={() => handleSave(eq)}
                      >
                        Salvar
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-blue-600 hover:underline text-xs"
                        onClick={() => setEditando(eq.id)}
                      >
                        Editar
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-red-600 hover:underline ml-2 text-xs"
                      onClick={() => handleDelete(eq.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
