import { useState } from 'react'
import { addDoc, collection, getDocs } from 'firebase/firestore'
import { db, ensureAnonAuth } from '../firebaseConfig'

export default function TestFirestore() {
  const [mensagem, setMensagem] = useState('')
  const [equipamentos, setEquipamentos] = useState<any[]>([])

  async function testarConexao() {
    setMensagem('Conectando...')
    try {
      // autentica anonimamente
      await ensureAnonAuth()
      setMensagem('✅ Autenticação anônima feita com sucesso!')
    } catch (err: any) {
      setMensagem('❌ Erro na autenticação: ' + err.message)
      return
    }

    try {
      // teste de escrita
      const ref = await addDoc(collection(db, 'equipamentos'), {
        nome: 'Datashow Teste',
        tipo: 'Datashow',
        bloco: 'B',
        status: 'disponivel',
        criadoEm: new Date().toISOString(),
      })
      setMensagem((m) => m + `\n✅ Documento criado com ID: ${ref.id}`)
    } catch (err: any) {
      setMensagem((m) => m + `\n❌ Erro ao criar documento: ${err.message}`)
    }

    try {
      // teste de leitura
      const snap = await getDocs(collection(db, 'equipamentos'))
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setEquipamentos(data)
      setMensagem((m) => m + `\n✅ Leitura de ${data.length} documentos concluída.`)
    } catch (err: any) {
      setMensagem((m) => m + `\n❌ Erro na leitura: ${err.message}`)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Teste de Conexão com Firebase</h2>
      <p>Essa página confirma autenticação e acesso ao Firestore.</p>

      <button onClick={testarConexao} style={{ padding: '10px 16px', marginBottom: 12 }}>
        🔄 Testar conexão
      </button>

      <pre
        style={{
          background: '#f8f8f8',
          padding: 12,
          borderRadius: 8,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {mensagem || 'Clique no botão acima para iniciar o teste.'}
      </pre>

      {equipamentos.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Equipamentos encontrados:</h3>
          <ul>
            {equipamentos.map((e) => (
              <li key={e.id}>
                <strong>{e.nome}</strong> — {e.tipo} ({e.bloco})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
