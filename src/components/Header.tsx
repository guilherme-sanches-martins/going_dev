import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const { pathname } = useLocation()
  const isSolic = pathname === '/' || pathname.startsWith('/solicitante')
  return (
    <header className="px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">Sistema de Gestao Institucional</h1>
        <p className="text-sm text-grayb-400">Audiovisual - Marketing - Cerimonial</p>
      </div>
      <nav className="flex gap-3">
        <Link to="/" className={`btn ${isSolic ? 'btn-dark' : 'btn-ghost'}`}>Solicitante</Link>
        <Link to="/colaboradores" className={`btn ${!isSolic ? 'btn-dark' : 'btn-ghost'}`}>Colaboradores</Link>
      </nav>
    </header>
  )
}

