import { useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

/* ------------------------------------------------------------------
 *  FiberHero — recreation of the reference:
 *  photoreal cutout portrait on a light studio background, with
 *  white fiber strands flowing out from behind the head, glowing
 *  warm-orange tips, energy pulses travelling along the strands,
 *  and drifting bokeh. Real-time, no video dependency.
 *
 *  If /hero.mp4 exists in public/, the <Hero> section swaps this
 *  canvas for the video automatically (see Hero.jsx).
 * ------------------------------------------------------------------ */

// Photo geometry: cutout is 841x1080
const PLANE_H = 11
const PLANE_W = PLANE_H * (841 / 1080)
const PHOTO_POS = [2.6, -0.9, 0]
// head centre in world coords (measured from the photo: ~47% x, 27% y)
const HEAD = new THREE.Vector3(
  PHOTO_POS[0] + (0.47 - 0.5) * PLANE_W,
  PHOTO_POS[1] + (0.5 - 0.27) * PLANE_H,
  -0.6,
)
const HEAD_R = 1.55

function makeSoftDot() {
  const s = 64
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.7)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  return new THREE.CanvasTexture(c)
}

/* deterministic pseudo-random so SSR/HMR stay stable */
function mulberry(seed) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildStrands(count) {
  const rand = mulberry(1337)
  const strands = []
  for (let i = 0; i < count; i++) {
    // anchor on a ring behind the head, biased to the back (he faces right)
    const ang = Math.PI * (0.45 + 1.0 * rand()) // 81°..261° (crown → back → below)
    const rr = HEAD_R * (0.75 + rand() * 0.5)
    const ax = HEAD.x + Math.cos(ang) * rr
    const ay = HEAD.y + Math.sin(ang) * rr * 1.15
    const az = -0.8 - rand() * 1.6

    // flow mostly outward + down: jellyfish cascade, not a fountain
    const dir = new THREE.Vector3(Math.cos(ang), Math.sin(ang) * 0.35, 0)
      .normalize()
    const len = 5 + rand() * 8
    const sag = 0.55 + rand() * 0.9

    const p0 = new THREE.Vector3(ax, ay, az)
    const p1 = p0.clone().addScaledVector(dir, len * 0.3)
      .add(new THREE.Vector3((rand() - 0.5) * 1.2, (rand() - 0.5) * 1.2, (rand() - 0.5) * 0.8))
    const p2 = p0.clone().addScaledVector(dir, len * 0.65)
      .add(new THREE.Vector3(0, -len * sag * 0.4, (rand() - 0.5) * 1.2))
    const p3 = p0.clone().addScaledVector(dir, len)
      .add(new THREE.Vector3((rand() - 0.5) * 2, -len * sag, (rand() - 0.5) * 1.6))

    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3])
    const pts = curve.getPoints(40)
    strands.push({ pts, seed: rand() * 100, len })
  }
  return strands
}

function Strands({ count = 110, reduced }) {
  const strands = useMemo(() => buildStrands(count), [count])
  const dot = useMemo(makeSoftDot, [])

  // one merged geometry: line segments between consecutive samples
  const { posAttr, colAttr, segGeo, tipGeo, tipAttr, pulseGeo, pulseAttr, base } = useMemo(() => {
    const P = 41 // points per strand
    const positions = []
    const colors = []
    const index = []
    const root = new THREE.Color('#83878d')
    const mid = new THREE.Color('#c6c4bf')
    const tip = new THREE.Color('#f6f3ec')
    strands.forEach((s, si) => {
      const off = si * P
      s.pts.forEach((p, k) => {
        positions.push(p.x, p.y, p.z)
        const u = k / (P - 1)
        const c = u < 0.5 ? root.clone().lerp(mid, u * 2) : mid.clone().lerp(tip, (u - 0.5) * 2)
        colors.push(c.r, c.g, c.b)
        if (k < P - 1) index.push(off + k, off + k + 1)
      })
    })
    const posAttr = new THREE.BufferAttribute(new Float32Array(positions), 3)
    const colAttr = new THREE.BufferAttribute(new Float32Array(colors), 3)
    const segGeo = new THREE.BufferGeometry()
    segGeo.setAttribute('position', posAttr)
    segGeo.setAttribute('color', colAttr)
    segGeo.setIndex(index)

    // glowing tips (one point at each strand end)
    const tipPos = new Float32Array(strands.length * 3)
    const tipAttr = new THREE.BufferAttribute(tipPos, 3)
    const tipGeo = new THREE.BufferGeometry()
    tipGeo.setAttribute('position', tipAttr)

    // travelling pulses (one per strand)
    const pulsePos = new Float32Array(strands.length * 3)
    const pulseAttr = new THREE.BufferAttribute(pulsePos, 3)
    const pulseGeo = new THREE.BufferGeometry()
    pulseGeo.setAttribute('position', pulseAttr)

    return {
      posAttr, colAttr, segGeo, tipGeo, tipAttr, pulseGeo, pulseAttr,
      base: new Float32Array(positions),
    }
  }, [strands])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const P = 41
    const arr = posAttr.array
    strands.forEach((s, si) => {
      const sway = reduced ? 0 : 1
      for (let k = 0; k < P; k++) {
        const j = (si * P + k) * 3
        const u = k / (P - 1)
        const w = u * u * sway // tips sway, roots stay pinned
        arr[j] = base[j] + Math.sin(t * 0.7 + s.seed + u * 3.5) * 0.42 * w
        arr[j + 1] = base[j + 1] + Math.cos(t * 0.55 + s.seed * 1.7 + u * 2.8) * 0.3 * w
        arr[j + 2] = base[j + 2] + Math.sin(t * 0.45 + s.seed * 0.9 + u * 4.2) * 0.35 * w
      }
      // tip glow follows the (displaced) last point
      const last = (si * P + P - 1) * 3
      tipAttr.array[si * 3] = arr[last]
      tipAttr.array[si * 3 + 1] = arr[last + 1]
      tipAttr.array[si * 3 + 2] = arr[last + 2]
      // pulse travels root -> tip
      const pu = reduced ? 0.85 : (t * 0.12 + s.seed * 0.37) % 1
      const pk = Math.min(P - 1, Math.floor(pu * (P - 1)))
      const pj = (si * P + pk) * 3
      pulseAttr.array[si * 3] = arr[pj]
      pulseAttr.array[si * 3 + 1] = arr[pj + 1]
      pulseAttr.array[si * 3 + 2] = arr[pj + 2]
    })
    posAttr.needsUpdate = true
    tipAttr.needsUpdate = true
    pulseAttr.needsUpdate = true
  })

  return (
    <group>
      <lineSegments geometry={segGeo}>
        <lineBasicMaterial vertexColors transparent opacity={0.85} toneMapped={false} />
      </lineSegments>
      {/* warm glowing tips — HDR colour so only these bloom */}
      <points geometry={tipGeo}>
        <pointsMaterial
          size={0.34}
          map={dot}
          color={new THREE.Color(5.0, 1.9, 0.55)}
          transparent
          depthWrite={false}
          toneMapped={false}
          sizeAttenuation
        />
      </points>
      <points geometry={pulseGeo}>
        <pointsMaterial
          size={0.18}
          map={dot}
          color={new THREE.Color(3.2, 1.5, 0.6)}
          transparent
          opacity={0.9}
          depthWrite={false}
          toneMapped={false}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

function Bokeh({ count = 130 }) {
  const dot = useMemo(makeSoftDot, [])
  const ref = useRef()
  const { geo, seeds } = useMemo(() => {
    const rand = mulberry(777)
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const grey = new THREE.Color('#aab0b8')
    const warm = new THREE.Color('#e8a06a')
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 30
      pos[i * 3 + 1] = (rand() - 0.5) * 18
      pos[i * 3 + 2] = -3 - rand() * 10
      const c = rand() < 0.25 ? warm : grey
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b
      seeds[i] = rand() * 100
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return { geo: g, seeds }
  }, [count])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const arr = ref.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(t * 0.3 + seeds[i]) * 0.0035
      arr[i * 3] += Math.cos(t * 0.2 + seeds[i] * 1.3) * 0.003
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.22}
        map={dot}
        vertexColors
        transparent
        opacity={0.5}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

function Portrait({ reduced }) {
  const tex = useLoader(THREE.TextureLoader, './profile-cutout.png')
  const ref = useRef()
  const { pointer } = useThree()
  tex.colorSpace = THREE.SRGBColorSpace

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!ref.current) return
    if (!reduced) {
      ref.current.position.y = PHOTO_POS[1] + Math.sin(t * 0.5) * 0.12
      ref.current.rotation.y += (pointer.x * 0.07 - ref.current.rotation.y) * 0.04
      ref.current.rotation.x += (-pointer.y * 0.035 - ref.current.rotation.x) * 0.04
    }
  })

  return (
    <mesh ref={ref} position={PHOTO_POS} renderOrder={2}>
      <planeGeometry args={[PLANE_W, PLANE_H]} />
      <meshBasicMaterial
        map={tex}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

function Rig({ children }) {
  const ref = useRef()
  const { pointer } = useThree()
  useFrame(() => {
    if (!ref.current) return
    ref.current.rotation.y += (pointer.x * 0.05 - ref.current.rotation.y) * 0.04
    ref.current.rotation.x += (-pointer.y * 0.03 - ref.current.rotation.x) * 0.04
  })
  return <group ref={ref}>{children}</group>
}

export default function FiberHero() {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const small = typeof window !== 'undefined' && window.innerWidth <= 768
  const strandCount = small ? 60 : 110

  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 0, 16], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <Rig>
        <Strands count={strandCount} reduced={reduced} />
        <Bokeh count={small ? 60 : 130} />
        <Portrait reduced={reduced} />
      </Rig>
      {!small && !reduced && (
        <EffectComposer disableNormalPass>
          {/* threshold 1.0: only the HDR orange tips bloom, photo stays clean */}
          <Bloom mipmapBlur intensity={0.9} luminanceThreshold={1.0} radius={0.7} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
