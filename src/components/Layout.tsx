import { Outlet } from 'react-router-dom'
import { Carga } from './Carga'
import { Footer } from './Footer'
import { Header } from './Header'
import './Layout.css'

export function Layout() {
  return (
    <div className="shell">
      <Header />
      <main className="shell__main">
        <Outlet />
      </main>
      <Footer />
      <Carga />
    </div>
  )
}
