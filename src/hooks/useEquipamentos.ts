import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Equipamento } from '../types'

export function useEquipamentos() {
  const [equipamentos, setEquipamentos] = useState<(Equipamento & { id: string })[]>([])

  useEffect(() => {
    const q = query(collection(db, 'equipamentos'), orderBy('nome'))
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => {
        const docData = d.data() as Equipamento
        return { ...docData, id: d.id } // ✅ agora o TS entende que id vem do Firestore
      })
      setEquipamentos(data)
    })

    return () => unsub()
  }, [])

  return equipamentos
}
