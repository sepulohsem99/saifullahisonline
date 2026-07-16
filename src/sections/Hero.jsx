import { useEffect, useRef, useState } from 'react'
import FiberHero from '../components/FiberHero'
import { site } from '../config'

/* Hero has three modes:
 *  1. No hero media in public/ → real-time WebGL fiber scene (FiberHero)
 *  2. Desktop + public/hero.mp4 → scroll-scrubbed video (all-intra encode)
 *  3. Mobile + public/frames/f000..jpg → scroll-scrubbed CANVAS image
 *     sequence (Apple-style) — video seeking is too slow on phones.
 * The scrub pins the section for ~3 screens; scroll drives the playhead.
 */
const SCRUB_VHS = 3
const FRAME_COUNT = 51 // public/frames/f000.jpg … f050.jpg (10fps × 5.1s)
const FOCUS_X = 0.62 // subject sits at 62% of the 16:9 frame

function headOk(url, accept) {
  return fetch(url, { method: 'HEAD' })
    .then((r) => (r.ok && accept(r.headers.get('content-type') || '') ? url : null))
    .catch(() => null)
}

export default function Hero() {
  const [media, setMedia] = useState(null) // {type:'video',src} | {type:'frames'}
  const [logoSrc, setLogoSrc] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const framesRef = useRef([])
  const wrapRef = useRef(null)
  const contentRef = useRef(null)
  const logoRef = useRef(null)
  const raf = useRef(0)

  useEffect(() => {
    const small = window.innerWidth <= 860
    ;(async () => {
      if (small) {
        // canvas frame-scrub: the only smooth option on mobile Safari
        if (await headOk('./frames/f000.jpg', (t) => t.startsWith('image'))) {
          setMedia({ type: 'frames' })
          return
        }
      }
      const candidates = small ? ['./hero-mobile.mp4', './hero.mp4'] : ['./hero.mp4']
      for (const url of candidates) {
        if (await headOk(url, (t) => t.startsWith('video'))) {
          setMedia({ type: 'video', src: url })
          return
        }
      }
    })()
    headOk('./appium-logo.png', (t) => t.startsWith('image')).then((png) =>
      png ? setLogoSrc(png) : headOk('./appium-logo.svg', (t) => t.includes('svg')).then(setLogoSrc),
    )
  }, [])

  // scroll scrub — rAF loop (robust against scroll-event quirks)
  useEffect(() => {
    if (!media) return
    const wrap = wrapRef.current
    if (!wrap) return
    const video = videoRef.current
    const canvas = canvasRef.current

    let alive = true
    let smoothP = 0
    let lastFrame = -1

    // ---- frames mode setup ----
    let ctx = null
    const imgs = framesRef.current
    const sizeCanvas = () => {
      if (!canvas) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      lastFrame = -1 // force redraw
    }
    const drawFrame = (idx) => {
      if (!ctx) return
      // nearest loaded frame (downloads may still be in flight)
      let img = null
      for (let d = 0; d < FRAME_COUNT; d++) {
        const lo = imgs[idx - d]
        const hi = imgs[idx + d]
        if (lo && lo.complete && lo.naturalWidth) { img = lo; break }
        if (hi && hi.complete && hi.naturalWidth) { img = hi; break }
      }
      if (!img) return
      const cw = canvas.width
      const ch = canvas.height
      // cover-crop keeping the subject (FOCUS_X) in view
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
      const sw = cw / scale
      const sh = ch / scale
      const sx = Math.min(Math.max(FOCUS_X * img.naturalWidth - sw / 2, 0), img.naturalWidth - sw)
      const sy = (img.naturalHeight - sh) / 2
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch)
    }
    if (media.type === 'frames' && canvas) {
      ctx = canvas.getContext('2d')
      sizeCanvas()
      window.addEventListener('resize', sizeCanvas)
      if (imgs.length === 0) {
        for (let i = 0; i < FRAME_COUNT; i++) {
          const img = new Image()
          img.src = `./frames/f${String(i).padStart(3, '0')}.jpg`
          if (i === 0) img.onload = () => { lastFrame = -1 } // first paint
          imgs.push(img)
        }
      }
    }
    if (media.type === 'video' && video) video.pause()

    const tick = () => {
      if (!alive) return
      const total = wrap.offsetHeight - window.innerHeight
      const rawP = Math.min(1, Math.max(0, -wrap.getBoundingClientRect().top / Math.max(1, total)))
      smoothP += (rawP - smoothP) * 0.16
      if (Math.abs(rawP - smoothP) < 0.0005) smoothP = rawP
      const p = smoothP

      if (media.type === 'video' && video && video.duration && video.readyState >= 1) {
        const target = p * Math.max(0, video.duration - 0.05)
        if (Math.abs(video.currentTime - target) > 0.015) video.currentTime = target
      } else if (media.type === 'frames') {
        const idx = Math.round(p * (FRAME_COUNT - 1))
        if (idx !== lastFrame) {
          lastFrame = idx
          drawFrame(idx)
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
      window.removeEventListener('resize', sizeCanvas)
    }
  }, [media])

  const inner = (
    <section className={`hero${media ? ' hero--sticky' : ''}`} id="top">
      <div className="hero__canvas">
        {media?.type === 'frames' ? (
          <canvas ref={canvasRef} className="hero__video" />
        ) : media?.type === 'video' ? (
          <video
            ref={videoRef}
            className="hero__video"
            src={media.src}
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

      {media && logoSrc && (
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
      style={{ height: media ? `${(SCRUB_VHS + 1) * 100}vh` : 'auto' }}
    >
      {inner}
    </div>
  )
}
