import { useEffect, useRef } from 'react'
import Campus from '../assets/campus.svg?react'

type Props = {
  salasReservadas: string[]
  onSelectSala?: (salaId: string) => void
}

export default function MapaSVG({ salasReservadas, onSelectSala }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const svgEl = containerRef.current.querySelector('svg') as SVGSVGElement | null
    if (!svgEl) return

    // considera salas e auditórios (ex.: B101, C204, D305, AUD_B1, AUD_C3)
    const idRegex = /^(B|C|D)\d{3}$|^AUD_(B|C)\d$/i
    const todas = Array.from(svgEl.querySelectorAll<SVGGraphicsElement>('[id]'))
    const salas = todas.filter((el) => idRegex.test(el.id))

    // reset visual
    salas.forEach((el) => {
      el.style.fill = '#27ae60'                // disponível (verde)
      el.style.cursor = onSelectSala ? 'pointer' : 'default'
      el.style.transition = 'fill 0.25s ease'
    })

    // marca reservadas
    salasReservadas.forEach((id) => {
      const el = salas.find((s) => s.id === id)
      if (el) el.style.fill = '#e74c3c'        // reservada (vermelho)
    })

    // clique
    salas.forEach((el) => {
      const handler = () => onSelectSala && onSelectSala(el.id)
      el.removeEventListener('click', handler as any)
      if (onSelectSala) el.addEventListener('click', handler as any)
    })

    // cleanup
    return () => {
      salas.forEach((el) => {
        const handler = () => onSelectSala && onSelectSala(el.id)
        el.removeEventListener('click', handler as any)
      })
    }
  }, [salasReservadas, onSelectSala])

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', maxWidth: 900, margin: '0 auto' }}
    >
      <Campus style={{ width: '100%', height: 'auto', display: 'block' }} />

      {/* Legenda */}
      <div
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          background: 'white',
          padding: '8px 12px',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, background: '#27ae60', display: 'inline-block', borderRadius: 2 }} />
          <small style={{ color: 'rgba(0,0,0,.6)' }}>Disponível</small>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span style={{ width: 12, height: 12, background: '#e74c3c', display: 'inline-block', borderRadius: 2 }} />
          <small style={{ color: 'rgba(0,0,0,.6)' }}>Reservado</small>
        </div>
      </div>
    </div>
  )
}
