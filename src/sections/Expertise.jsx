import Reveal from '../components/Reveal'
import { expertise } from '../config'

export default function Expertise() {
  return (
    <section className="section-pad" id="expertise">
      <div className="container">
        <Reveal>
          <p className="eyebrow">What I do</p>
          <h2 className="section-title">Expertise that ships <span className="gradient-text">green builds</span></h2>
          <p className="section-sub">
            From flaky manual checks to resilient, self-healing automation — here's where I add value.
          </p>
        </Reveal>

        <div className="exp__grid">
          {expertise.map((e, i) => (
            <Reveal key={e.title} delay={i * 0.08}>
              <article className="card exp__card">
                <div className="exp__num">0{i + 1}</div>
                <div className="exp__tool">{e.tool}</div>
                <h3 className="exp__title">{e.title}</h3>
                <p className="exp__desc">{e.desc}</p>
                <div className="exp__tags">
                  {e.tags.map((t) => (
                    <span key={t} className="chip">{t}</span>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
