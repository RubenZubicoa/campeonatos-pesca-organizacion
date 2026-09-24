import { Outlet } from 'react-router-dom'
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
    </div>
  )
}
