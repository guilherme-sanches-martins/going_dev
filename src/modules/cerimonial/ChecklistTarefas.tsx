// src/modules/cerimonial/ChecklistTarefas.tsx
import { useState } from 'react'

type Props = {
  eventos: any[]
}

export default function ChecklistTarefas({ eventos }: Props) {
  const [tarefaSelecionada, setTarefaSelecionada] = useState<any>(null)

  const tarefasBase = [
    { nome: 'Confirmar local', setor: 'Cerimonial' },
    { nome: 'Solicitar som e microfones', setor: 'Audiovisual' },
    { nome: 'Criar banner do evento', setor: 'Marketing' },
  ]

  return (
    <div className="card p-3">
      {eventos.length === 0 ? (
        <p className="text-grayb-400 text-sm">Nenhum evento para exibir.</p>
      ) : (
        <>
          <select
            className="select text-sm mb-3"
            onChange={(e) =>
              setTarefaSelecionada(eventos.find((ev) => ev.id === e.target.value))
            }
          >
            <option value="">Selecione um evento</option>
            {eventos.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.titulo}
              </option>
            ))}
          </select>

          {tarefaSelecionada && (
            <ul className="text-sm grid gap-2">
              {tarefasBase.map((t, i) => (
                <li key={i} className="border border-grayb-100 rounded-lg p-2 flex justify-between">
                  <span>
                    {t.nome} <span className="text-grayb-400">({t.setor})</span>
                  </span>
                  <button className="btn btn-xs btn-dark">Concluir</button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
