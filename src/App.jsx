import { useEffect, useState } from 'react'
import Nav from './components/Nav'
import Hero from './sections/Hero'
import About from './sections/About'
import Expertise from './sections/Expertise'
import Projects from './sections/Projects'
import TechStack from './sections/TechStack'
import Contact from './sections/Contact'
import './app.css'

function Loader({ done }) {
  return (
    <div className={`loader ${done ? 'loader--done' : ''}`}>
      <div className="loader__mark">
        <span className="loader__pulse" />
        initializing test suite…
      </div>
    </div>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 900)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <Loader done={ready} />
      <Nav />
      <main>
        <Hero />
        <About />
        <Expertise />
        <Projects />
        <TechStack />
        <Contact />
      </main>
    </>
  )
}
