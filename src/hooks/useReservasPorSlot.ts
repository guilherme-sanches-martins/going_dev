import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { ReservaItem } from '../types'

// 🔧 Adicionamos 'todos' como possível valor
export function useReservasPorSlot(data: string, periodo?: 'matutino' | 'vespertino' | 'noturno' | 'todos') {
  const [reservas, setReservas] = useState<ReservaItem[]>([])

  useEffect(() => {
    const base = collection(db, 'reservas')
    const q =
      periodo && periodo !== 'todos'
        ? query(base, where('data', '==', data), where('periodo', '==', periodo))
        : query(base, where('data', '==', data))

    const unsub = onSnapshot(q, (snap) => {
      setReservas(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    })

    return () => unsub()
  }, [data, periodo])

  return reservas
}
