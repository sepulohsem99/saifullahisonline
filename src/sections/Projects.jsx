import Reveal from '../components/Reveal'
import { projects } from '../config'

export default function Projects() {
  return (
    <section className="section-pad" id="projects">
      <div className="container">
        <Reveal>
          <p className="eyebrow">Selected work</p>
          <h2 className="section-title">Automation, <span className="gradient-text">in production</span></h2>
          <p className="section-sub">
            Government platforms, enterprise systems, and the automation lab I tinker in.
          </p>
        </Reveal>

        <div className="proj__list">
          {projects.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.06}>
              <a href={p.link} className="card proj__row">
                <div className="proj__index">{String(i + 1).padStart(2, '0')}</div>
                <div className="proj__main">
                  <h3 className="proj__name">{p.name}</h3>
                  <p className="proj__blurb">{p.blurb}</p>
                  <div className="proj__stack">
                    {p.stack.map((s) => (
                      <span key={s} className="chip">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="proj__arrow" aria-hidden>↗</div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
