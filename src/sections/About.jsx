import Reveal from '../components/Reveal'
import { about, site } from '../config'

export default function About() {
  return (
    <section className="about section-pad" id="about">
      <div className="container about__grid">
        <Reveal className="about__media">
          <div className="about__photo">
            <img src="./profile-round.jpeg" alt={site.name} loading="lazy" />
            <div className="about__ring" />
          </div>
          <div className="about__badge">
            <span className="about__badge-dot" />
            Available for work
          </div>
        </Reveal>

        <div className="about__body">
          <Reveal>
            <p className="eyebrow">About me</p>
            <h2 className="section-title">{about.heading}</h2>
          </Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} delay={0.1 + i * 0.08}>
              <p className="about__para">{p}</p>
            </Reveal>
          ))}

          <Reveal delay={0.25}>
            <div className="about__stats">
              {about.stats.map((s) => (
                <div key={s.label} className="about__stat">
                  <div className="about__stat-value gradient-text">{s.value}</div>
                  <div className="about__stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
