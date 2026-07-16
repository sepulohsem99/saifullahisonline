import { useEffect, useRef, useState } from 'react'
import FiberHero from '../components/FiberHero'
import { site } from '../config'

/* Hero has two modes:
 *  1. No public/hero.mp4  → real-time WebGL fiber scene (FiberHero)
 *  2. public/hero.mp4 present (generated with Kling — see KLING-PROMPT.md)
 *     → reference-style SCROLL SCRUB: the section pins for ~3 screens and
 *     the video's currentTime follows scroll, so the face dissolves into
 *     strands and gathers into the ring as you scroll. If a crisp logo is
 *     dropped at public/appium-logo.png (or .svg), it cross-fades in over
 *     the ring at the end of the scrub.
 */
const SCRUB_VHS = 3 // how many viewport-heights the scrub lasts

function headOk(url, accept) {
  return fetch(url, { method: 'HEAD' })
    .then((r) => (r.ok && accept(r.headers.get('content-type') || '') ? url : null))
    .catch(() => null)
}

export default function Hero() {
  const [videoSrc, setVideoSrc] = useState(null)
  const [logoSrc, setLogoSrc] = useState(null)
  const videoRef = useRef(null)
  const wrapRef = useRef(null)
  const contentRef = useRef(null)
  const logoRef = useRef(null)
  const raf = useRef(0)

  useEffect(() => {
    headOk('./hero.mp4', (t) => t.startsWith('video')).then(setVideoSrc)
    headOk('./appium-logo.png', (t) => t.startsWith('image')).then((png) =>
      png ? setLogoSrc(png) : headOk('./appium-logo.svg', (t) => t.includes('svg')).then(setLogoSrc),
    )
  }, [])

  // scroll scrub — rAF loop (robust against scroll-event quirks / smooth scrolling)
  useEffect(() => {
    if (!videoSrc) return
    const video = videoRef.current
    const wrap = wrapRef.current
    if (!video || !wrap) return

    video.pause()
    let alive = true
    let smoothP = 0 // eased progress — trails raw scroll for buttery scrubbing

    const tick = () => {
      if (!alive) return
      const total = wrap.offsetHeight - window.innerHeight
      const rawP = Math.min(1, Math.max(0, -wrap.getBoundingClientRect().top / Math.max(1, total)))
      smoothP += (rawP - smoothP) * 0.16
      if (Math.abs(rawP - smoothP) < 0.0005) smoothP = rawP
      const p = smoothP

      if (video.duration && video.readyState >= 1) {
        const target = p * Math.max(0, video.duration - 0.05)
        // skip micro-seeks: each currentTime write forces a decode
        if (Math.abs(video.currentTime - target) > 0.015) {
          video.currentTime = target
        }
      }
      // headline fades out over the first third of the scrub
      if (contentRef.current) {
        contentRef.current.style.opacity = Math.max(0, 1 - p * 2.6)
        contentRef.current.style.transform = `translateY(${p * -60}px)`
        contentRef.current.style.pointerEvents = p > 0.3 ? 'none' : ''
      }
      // crisp logo cross-fades in over the gathered ring at the end
      if (logoRef.current) {
        const lp = Math.min(1, Math.max(0, (p - 0.78) / 0.18))
        logoRef.current.style.opacity = lp
        logoRef.current.style.transform = `translate(-50%, -50%) scale(${0.85 + 0.15 * lp})`
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      alive = false
      cancelAnimationFrame(raf.current)
    }
  }, [videoSrc])

  const inner = (
    <section className={`hero${videoSrc ? ' hero--sticky' : ''}`} id="top">
      <div className="hero__canvas">
        {videoSrc ? (
          <video
            ref={videoRef}
            className="hero__video"
            src={videoSrc}
            muted
            playsInline
            preload="auto"
            poster="./kling-start-frame.jpg"
          />
        ) : (
          <FiberHero />
        )}
      </div>
      <div className="hero__fade" />

      {videoSrc && logoSrc && (
        <img ref={logoRef} className="hero__logo-end" src={logoSrc} alt="Appium" />
      )}

      <div className="container hero__content" ref={contentRef}>
        <p className="eyebrow rise" style={{ animationDelay: '0.2s' }}>
          {site.name} — {site.role}
        </p>

        <h1 className="hero__title rise" style={{ animationDelay: '0.35s' }}>
          I teach <em>machines</em> to test like humans.
        </h1>

        <p className="hero__tag rise" style={{ animationDelay: '0.55s' }}>
          {site.tagline} Mobile &amp; web regression, automated end-to-end with{' '}
          <span className="hero__hl">Appium</span> and{' '}
          <span className="hero__hl">Playwright</span>.
        </p>

        <div className="hero__actions rise" style={{ animationDelay: '0.7s' }}>
          <a href="#projects" className="btn btn-primary">View my work →</a>
          <a href="#contact" className="btn btn-ghost">Get in touch</a>
        </div>
      </div>

      <div className="hero__scroll">
        <span>scroll</span>
        <span className="hero__scroll-line" />
      </div>
    </section>
  )

  // stable wrapper either way — swapping the tree remounts the headline
  // mid-animation and leaves it stuck at opacity 0
  return (
    <div
      className="hero-scrub"
      ref={wrapRef}
      style={{ height: videoSrc ? `${(SCRUB_VHS + 1) * 100}vh` : 'auto' }}
    >
      {inner}
    </div>
  )
}
