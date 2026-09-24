import { NavLink } from 'react-router-dom'
import './Header.css'

export function Header() {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <NavLink to="/" className="brand" aria-label="The Lake, inicio">
          <img
            src="/logo-the-lake.png"
            alt="The Lake — Private Fishing Reserve"
            className="brand__logo"
          />
        </NavLink>
        <a
          className="promo"
          href="https://www.thelakefish.es/"
          target="_blank"
          rel="noreferrer"
        >
          <span className="promo__kicker">The Lake</span>
          <strong>Equípate con los mejores</strong>
          <span>Tu tienda de artículos de pesca premium</span>
        </a>
      </div>
    </header>
  )
}
