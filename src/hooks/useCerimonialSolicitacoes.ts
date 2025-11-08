import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebaseConfig'

export type CerimonialItem = {
  id: string
  solicitante: string
  titulo: string
  data: string
  horario: string
  periodo: string
  local: string
  itensAdicionais?: string
  status: string
}

export function useCerimonialSolicitacoes() {
  const [solicitacoes, setSolicitacoes] = useState<CerimonialItem[]>([])

  useEffect(() => {
    const ref = collection(db, 'cerimonial')
    const unsub = onSnapshot(ref, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CerimonialItem[]
      setSolicitacoes(list)
    })
    return () => unsub()
  }, [])

  return solicitacoes
}
