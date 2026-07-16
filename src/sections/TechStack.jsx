import Reveal from '../components/Reveal'
import { techStack } from '../config'

export default function TechStack() {
  return (
    <section className="section-pad" id="stack">
      <div className="container">
        <Reveal>
          <p className="eyebrow">Toolbox</p>
          <h2 className="section-title">Tech I <span className="gradient-text">automate with</span></h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="stack__grid">
            {techStack.map((t) => (
              <div key={t} className="stack__item">
                <span className="stack__node" />
                {t}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
