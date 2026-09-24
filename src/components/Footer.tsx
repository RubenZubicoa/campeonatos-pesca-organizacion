import './Footer.css'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <img
            src="/logo-the-lake.png"
            alt=""
            className="footer__logo"
          />
          <p className="footer__tagline">Private Fishing Reserve</p>
        </div>
        <div>
          <h2 className="footer__heading">Organización</h2>
          <a className="footer__link" href="https://www.thelakefish.es/" target="_blank" rel="noreferrer">
            thelakefish.es
          </a>
          <span className="footer__link">Campeonatos de pesca</span>
        </div>
        <p className="footer__copy">
          The Lake · Organización de campeonatos. Reserva privada de pesca.
        </p>
      </div>
    </footer>
  )
}
