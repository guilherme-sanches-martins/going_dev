import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { MarketingSolicitacao } from '../types'

export function useMarketingSolicitacoes() {
  const [items, setItems] = useState<MarketingSolicitacao[]>([])
  useEffect(() => {
    const col = collection(db, 'marketing')
    const q = query(col, orderBy('criadoEm', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as MarketingSolicitacao[]
      setItems(arr)
    })
    return () => unsub()
  }, [])
  return items
}
