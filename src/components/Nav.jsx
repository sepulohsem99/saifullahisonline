import { useEffect, useState } from 'react'
import { site } from '../config'

const links = [
  ['About', '#about'],
  ['Expertise', '#expertise'],
  ['Projects', '#projects'],
  ['Stack', '#stack'],
  ['Contact', '#contact'],
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`nav ${scrolled ? 'nav--solid' : ''}`}>
      <div className="container nav__inner">
        <a href="#top" className="nav__brand">
          <span className="nav__dot" />
          {site.name.split(' ')[0]}
          <span className="nav__brand-dim">.dev</span>
        </a>

        <nav className={`nav__links ${open ? 'nav__links--open' : ''}`}>
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <a href="#contact" className="btn btn-primary nav__cta" onClick={() => setOpen(false)}>
            Let's talk
          </a>
        </nav>

        <button
          className="nav__burger"
          aria-label="Menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}
