import { addDoc, collection } from 'firebase/firestore'
import { db } from '../firebaseConfig'

export async function seedTeste() {
  console.log('🚀 Iniciando seedTeste...')
  try {
    const eq = await addDoc(collection(db, 'equipamentos'), {
      nome: 'Datashow 3',
      tipo: 'Datashow',
      bloco: 'B',
      status: 'disponivel',
      imagem: '/imagens/datashow3.jpg'
    })
    console.log('✅ Equipamento criado com ID:', eq.id)

    const res = await addDoc(collection(db, 'reservas'), {
      data: '2025-11-07',
      periodo: 'vespertino',
      bloco: 'B',
      salaId: 'B203',
      equipamentoId: eq.id,
      solicitante: 'Prof. Teste',
      status: 'pendente'
    })
    console.log('✅ Reserva criada com ID:', res.id)
  } catch (e) {
    console.error('❌ Erro no seedTeste:', e)
  }
}
