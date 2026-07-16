import Reveal from '../components/Reveal'
import { site } from '../config'

export default function Contact() {
  return (
    <section className="section-pad contact" id="contact">
      <div className="container">
        <Reveal className="contact__card card">
          <p className="eyebrow">Contact</p>
          <h2 className="section-title">
            Let's make your builds <span className="gradient-text">stay green</span>.
          </h2>
          <p className="section-sub contact__sub">
            Looking for someone to own your test automation? I'm one message away.
          </p>

          <div className="contact__actions">
            <a href={`mailto:${site.email}`} className="btn btn-primary">
              {site.email}
            </a>
            {site.resumeUrl !== '#' && (
              <a href={site.resumeUrl} className="btn btn-ghost">Download CV</a>
            )}
          </div>

          <div className="contact__socials">
            {Object.entries({
              LinkedIn: site.socials.linkedin,
              GitHub: site.socials.github,
              WhatsApp: site.socials.whatsapp,
            })
              .filter(([, url]) => url && url !== '#')
              .map(([label, url]) => (
                <a key={label} href={url} target="_blank" rel="noreferrer">{label}</a>
              ))}
          </div>
        </Reveal>
      </div>

      <footer className="footer">
        <div className="container footer__inner">
          <span>© {new Date().getFullYear()} {site.name}</span>
          <span className="footer__built">Built with React · Three.js · deployed on Vercel</span>
        </div>
      </footer>
    </section>
  )
}
