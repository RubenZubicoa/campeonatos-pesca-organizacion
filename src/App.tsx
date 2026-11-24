import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CampeonatoLayout } from './pages/CampeonatoLayout'
import { CampeonatoResumen } from './pages/CampeonatoResumen'
import { Configuracion } from './pages/Configuracion'
import { Campeonatos } from './pages/Campeonatos'
import { Clasificacion } from './pages/Clasificacion'
import { DetalleCapturas } from './pages/DetalleCapturas'
import { Escenario } from './pages/Escenario'
import { Mangas } from './pages/Mangas'
import { Participantes } from './pages/Participantes'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Campeonatos />} />
        <Route path="campeonatos" element={<Campeonatos />} />
        <Route path="campeonatos/:campeonatoId" element={<CampeonatoLayout />}>
          <Route index element={<CampeonatoResumen />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="escenario" element={<Escenario />} />
          <Route path="participantes" element={<Participantes />} />
          <Route path="mangas" element={<Mangas />} />
          <Route path="clasificacion" element={<Clasificacion />} />
          <Route path="clasificacion/:mangaId/:participanteId" element={<DetalleCapturas />} />
        </Route>
      </Route>
    </Routes>
  )
}
