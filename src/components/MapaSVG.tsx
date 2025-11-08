import { useEffect, useRef, useState } from 'react'
import Campus from '../assets/campus.svg?react'

type Props = {
  salasReservadas: string[]
  onSelectSala?: (salaId: string) => void
}

export default function MapaSVG({ salasReservadas, onSelectSala }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

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
      el.style.fill = '#27ae60' // disponível (verde)
      el.style.cursor = onSelectSala ? 'pointer' : 'default'
      el.style.transition = 'fill 0.25s ease'
    })

    // marca reservadas
    salasReservadas.forEach((id) => {
      const el = salas.find((s) => s.id === id)
      if (el) el.style.fill = '#e74c3c' // reservada (vermelho)
    })

    // eventos de interação
    salas.forEach((el) => {
      const isReservada = salasReservadas.includes(el.id)

      const handleClick = () => onSelectSala && onSelectSala(el.id)
      const handleMouseEnter = (e: MouseEvent) => {
        el.style.fill = isReservada ? '#c0392b' : '#1e8449' // escurece
        const svgRect = svgEl.getBoundingClientRect()
        setTooltip({
          x: e.clientX - svgRect.left + 10,
          y: e.clientY - svgRect.top + 10,
          text: el.id,
        })
      }
      const handleMouseMove = (e: MouseEvent) => {
        const svgRect = svgEl.getBoundingClientRect()
        setTooltip({
          x: e.clientX - svgRect.left + 10,
          y: e.clientY - svgRect.top + 10,
          text: el.id,
        })
      }
      const handleMouseLeave = () => {
        // restaura cor original
        el.style.fill = isReservada ? '#e74c3c' : '#27ae60'
        setTooltip(null)
      }

      // listeners
      el.addEventListener('click', handleClick)
      el.addEventListener('mouseenter', handleMouseEnter)
      el.addEventListener('mousemove', handleMouseMove)
      el.addEventListener('mouseleave', handleMouseLeave)

      // cleanup
      return () => {
        el.removeEventListener('click', handleClick)
        el.removeEventListener('mouseenter', handleMouseEnter)
        el.removeEventListener('mousemove', handleMouseMove)
        el.removeEventListener('mouseleave', handleMouseLeave)
      }
    })
  }, [salasReservadas, onSelectSala])

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', maxWidth: 900, margin: '0 auto' }}
    >
      <Campus style={{ width: '100%', height: 'auto', display: 'block' }} />

      {/* Tooltip flutuante */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            top: tooltip.y,
            left: tooltip.x,
            background: 'rgba(0,0,0,0.75)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 12,
            pointerEvents: 'none',
            transform: 'translateY(-100%)',
            whiteSpace: 'nowrap',
          }}
        >
          {tooltip.text}
        </div>
      )}

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
          <span
            style={{
              width: 12,
              height: 12,
              background: '#27ae60',
              display: 'inline-block',
              borderRadius: 2,
            }}
          />
          <small style={{ color: 'rgba(0,0,0,.6)' }}>Disponível</small>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 4,
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              background: '#e74c3c',
              display: 'inline-block',
              borderRadius: 2,
            }}
          />
          <small style={{ color: 'rgba(0,0,0,.6)' }}>Reservado</small>
        </div>
      </div>
    </div>
  )
}
