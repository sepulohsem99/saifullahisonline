import { useEffect, useRef, useState } from 'react'

/* Scroll-reveal without framer-motion: IntersectionObserver toggles a class,
 * CSS (.reveal in index.css) does the transition. */
export default function Reveal({ children, delay = 0, y = 24, className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '-80px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal${visible ? ' reveal--in' : ''} ${className}`}
      style={{ '--reveal-y': `${y}px`, '--reveal-delay': `${delay}s` }}
    >
      {children}
    </div>
  )
}
