// src/modules/cerimonial/CerimonialPainel.tsx
import { useEffect, useState } from 'react'
import CalendarioCerimonial from './CalendarioCerimonial'
import ChecklistTarefas from './ChecklistTarefas'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebaseConfig'

export default function CerimonialPainel() {
  const [eventos, setEventos] = useState<any[]>([])

  useEffect(() => {
    const fetchEventos = async () => {
      const snap = await getDocs(collection(db, 'cerimonial_eventos'))
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setEventos(data)
    }
    fetchEventos()
  }, [])

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <h4 className="font-medium mb-2">Calendário de Eventos</h4>
        <CalendarioCerimonial eventos={eventos} />
      </div>

      <div>
        <h4 className="font-medium mb-2">Checklist de Tarefas</h4>
        <ChecklistTarefas eventos={eventos} />
      </div>
    </div>
  )
}
