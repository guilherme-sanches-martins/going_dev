import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Solicitante from './pages/Solicitante'
import Colaboradores from './pages/Colaboradores'
import AdminAudiovisualPlaceholder from './pages/AdminAudiovisualPlaceholder'
import TestFirestore from './testes/TestFirestore'
import ColaboradorAudiovisual from './pages/ColaboradorAudiovisual'

export default function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="px-6 pb-10">
        <Routes>
          <Route path="/" element={<Solicitante />} />
          <Route path="/colaboradores" element={<Colaboradores />} />
          <Route path="/admin/audiovisual" element={<AdminAudiovisualPlaceholder />} />
          <Route path="/test-firestore" element={<TestFirestore />} />
          <Route path="/colaborador/audiovisual" element={<ColaboradorAudiovisual />} />
        </Routes>
      </main>
    </div>
  )
}
