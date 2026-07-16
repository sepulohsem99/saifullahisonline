import { useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

/* ------------------------------------------------------------------
 *  ParticleFace v2 — "human → robot scan" hero
 *
 *  - Chroma-keys the green-screen side profile into a point cloud
 *  - Per-row cylindrical depth: the head/body gets real 3D volume,
 *    so parallax and rotation read as a solid holographic bust
 *  - Strong horizontal contour RINGS (the "cylinder lines" look)
 *    + sparse faint vertical struts = robot scan wireframe
 *  - Scan beam sweeping the bust, brightening the ring it crosses
 *  - Staggered bottom-up assemble animation (like a 3D print/scan)
 *  - Bloom postprocessing for the cinematic glow
 * ------------------------------------------------------------------ */

const CYAN = new THREE.Color('#22d3ee')
const BRIGHT = new THREE.Color('#b7f7ff')
const DEEP = new THREE.Color('#1d4ed8')
const WHITE = new THREE.Color('#eaffff')

function makeDotTexture() {
  const s = 64
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.3, 'rgba(190,245,255,0.85)')
  g.addColorStop(1, 'rgba(190,245,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  return new THREE.CanvasTexture(c)
}

function useFaceData(url, { targetW = 150, scale = 15, volDepth = 3.6, detailDepth = 1.1 } = {}) {
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (cancelled) return
      const ratio = img.height / img.width
      const w = targetW
      const h = Math.round(targetW * ratio)
      const cv = document.createElement('canvas')
      cv.width = w
      cv.height = h
      const ctx = cv.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      const { data: px } = ctx.getImageData(0, 0, w, h)

      const isGreen = (r, g, b) => g > 90 && g > r * 1.25 && g > b * 1.25

      // pass 1: keep-mask + per-row extents (for cylindrical depth)
      const keepMask = new Uint8Array(w * h)
      const rowMin = new Int16Array(h).fill(32767)
      const rowMax = new Int16Array(h).fill(-1)
      const lumAt = new Float32Array(w * h)
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          const r = px[i], g = px[i + 1], b = px[i + 2]
          if (isGreen(r, g, b)) continue
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
          if (lum < 0.05) continue
          keepMask[y * w + x] = 1
          lumAt[y * w + x] = lum
          if (x < rowMin[y]) rowMin[y] = x
          if (x > rowMax[y]) rowMax[y] = x
        }
      }

      // pass 2: build points with cylindrical volume per row
      const positions = []
      const scatter = []
      const baseColors = []
      const meta = [] // per point: edge factor 0..1, world y (for scan/stagger)
      const grid = new Int32Array(w * h).fill(-1)
      const aspect = h / w

      for (let y = 0; y < h; y++) {
        if (rowMax[y] < 0) continue
        const cx = (rowMin[y] + rowMax[y]) / 2
        const hw = Math.max((rowMax[y] - rowMin[y]) / 2, 1)
        for (let x = rowMin[y]; x <= rowMax[y]; x++) {
          if (!keepMask[y * w + x]) continue
          const lum = lumAt[y * w + x]
          const idx = positions.length / 3
          grid[y * w + x] = idx

          const nx = THREE.MathUtils.clamp((x - cx) / hw, -1, 1)
          // cylinder profile: bulge toward camera, edges curve away
          const bulge = Math.sqrt(Math.max(0, 1 - nx * nx))

          const wx = (x / w - 0.5) * scale
          const wy = -(y / h - 0.5) * scale * aspect
          const wz = bulge * volDepth + (lum - 0.5) * detailDepth

          positions.push(wx, wy, wz)

          const theta = Math.random() * Math.PI * 2
          const phi = Math.acos(2 * Math.random() - 1)
          const rad = 18 + Math.random() * 12
          scatter.push(
            rad * Math.sin(phi) * Math.cos(theta),
            rad * Math.sin(phi) * Math.sin(theta),
            rad * Math.cos(phi) - 8,
          )

          const edge = Math.abs(nx) > 0.88 ? 1 : 0
          const col = CYAN.clone().lerp(BRIGHT, Math.pow(lum, 1.3))
          if (lum < 0.28) col.lerp(DEEP, 0.45)
          if (edge) col.lerp(WHITE, 0.5) // glowing silhouette rim
          baseColors.push(col.r, col.g, col.b)
          meta.push(edge, wy)
        }
      }
      const count = positions.length / 3

      // pass 3: line indices
      // rings: horizontal neighbours (gap-tolerant) — the "cylinder lines"
      const ringIdx = []
      for (let y = 0; y < h; y += 2) {
        for (let x = rowMin[y]; x <= rowMax[y]; x++) {
          const a = grid[y * w + x]
          if (a < 0) continue
          for (let g = 1; g <= 3; g++) {
            const b = x + g <= rowMax[y] ? grid[y * w + x + g] : -1
            if (b >= 0) { ringIdx.push(a, b); break }
          }
        }
      }
      // struts: sparse vertical columns, faint
      const strutIdx = []
      for (let x = 0; x < w; x += 5) {
        for (let y = 0; y < h - 1; y++) {
          const a = grid[y * w + x]
          if (a < 0) continue
          for (let g = 1; g <= 3; g++) {
            const b = y + g < h ? grid[(y + g) * w + x] : -1
            if (b >= 0) { strutIdx.push(a, b); break }
          }
        }
      }

      // world-y extents for the scan beam + stagger
      let yMin = Infinity, yMax = -Infinity
      for (let i = 0; i < count; i++) {
        const wy = meta[i * 2 + 1]
        if (wy < yMin) yMin = wy
        if (wy > yMax) yMax = wy
      }

      setData({
        positions: new Float32Array(positions),
        scatter: new Float32Array(scatter),
        baseColors: new Float32Array(baseColors),
        meta: new Float32Array(meta),
        ringIdx: new Uint32Array(ringIdx),
        strutIdx: new Uint32Array(strutIdx),
        count, yMin, yMax,
      })
    }
    img.src = url
    return () => { cancelled = true }
  }, [url, targetW, scale, volDepth, detailDepth])

  return data
}

/* soft ambient dust floating around the bust */
function Dust({ count = 220 }) {
  const ref = useRef()
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 46
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30
      pos[i * 3 + 2] = -4 - Math.random() * 18
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [count])
  const dot = useMemo(makeDotTexture, [])

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.012
  })

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.09}
        map={dot}
        color="#2aa8c4"
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

function FaceMesh({ data, reduced }) {
  const group = useRef()
  const dot = useMemo(makeDotTexture, [])
  const progress = useRef(0)
  const { pointer, size } = useThree()
  const xOffset = size.width > 860 ? 3.4 : 0

  const posAttr = useMemo(() => new THREE.BufferAttribute(data.positions.slice(), 3), [data])
  const colAttr = useMemo(() => new THREE.BufferAttribute(data.baseColors.slice(), 3), [data])

  const pointsGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', posAttr)
    g.setAttribute('color', colAttr)
    return g
  }, [posAttr, colAttr])

  const ringsGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', posAttr)
    g.setAttribute('color', colAttr)
    g.setIndex(new THREE.BufferAttribute(data.ringIdx, 1))
    return g
  }, [posAttr, colAttr, data])

  const strutsGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', posAttr)
    g.setIndex(new THREE.BufferAttribute(data.strutIdx, 1))
    return g
  }, [posAttr, data])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    progress.current = Math.min(2.0, progress.current + dt * 0.55)

    const target = data.positions
    const scat = data.scatter
    const arr = posAttr.array
    const colors = colAttr.array
    const base = data.baseColors
    const meta = data.meta
    const n = data.count
    const { yMin, yMax } = data
    const ySpan = yMax - yMin

    // scan beam position (world y), sweeping up then down
    const scanY = yMin + (0.5 + 0.5 * Math.sin(t * 0.55)) * ySpan
    const bandW = 1.1

    const mx = pointer.x * 10
    const my = pointer.y * 8

    for (let i = 0; i < n; i++) {
      const j = i * 3
      let tx = target[j]
      let ty = target[j + 1]
      let tz = target[j + 2]

      // per-point staggered assemble, bottom-up like a scanner building the bust
      const stag = (yMax - ty) / ySpan // 0 at top … 1 at bottom
      let p = reduced ? 1 : THREE.MathUtils.clamp(progress.current - stag * 0.8, 0, 1)
      p = 1 - Math.pow(1 - p, 3)

      if (!reduced) {
        // breathing
        tz += Math.sin(t * 1.2 + tx * 0.6 + ty * 0.4) * 0.1

        // cursor repel (in face plane)
        const dx = tx - mx
        const dy = ty - my
        const d2 = dx * dx + dy * dy
        if (d2 < 7) {
          const f = (7 - d2) / 7
          tx += dx * f * 0.45
          ty += dy * f * 0.45
          tz += f * 1.4
        }
      }

      arr[j] = scat[j] + (tx - scat[j]) * p
      arr[j + 1] = scat[j + 1] + (ty - scat[j + 1]) * p
      arr[j + 2] = scat[j + 2] + (tz - scat[j + 2]) * p

      // colour: base + scan-beam boost + edge shimmer
      const edge = meta[i * 2]
      const wy = meta[i * 2 + 1]
      const db = Math.abs(wy - scanY)
      let boost = db < bandW ? (1 - db / bandW) : 0
      boost = boost * boost * (reduced ? 0.25 : 0.55)
      const shimmer = edge ? 0.12 * (0.5 + 0.5 * Math.sin(t * 2.4 + wy * 3)) : 0
      const k = j
      colors[k] = Math.min(1, base[k] + boost * 0.9 + shimmer)
      colors[k + 1] = Math.min(1, base[k + 1] + boost * 0.95 + shimmer)
      colors[k + 2] = Math.min(1, base[k + 2] + boost * 1.0 + shimmer)
    }
    posAttr.needsUpdate = true
    colAttr.needsUpdate = true

    if (group.current) {
      // idle sway + mouse parallax — the volume makes this read properly 3D
      const ry = Math.sin(t * 0.22) * 0.16 + pointer.x * 0.42
      const rx = -pointer.y * 0.2
      group.current.rotation.y += (ry - group.current.rotation.y) * 0.045
      group.current.rotation.x += (rx - group.current.rotation.x) * 0.045
      group.current.position.x += (xOffset - group.current.position.x) * 0.05
      group.current.position.y = Math.sin(t * 0.4) * 0.18
    }
  })

  return (
    <group ref={group}>
      <points geometry={pointsGeo}>
        <pointsMaterial
          size={0.105}
          map={dot}
          vertexColors
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      {/* contour rings — the robot "cylinder lines" */}
      <lineSegments geometry={ringsGeo}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.45}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      {/* faint vertical struts */}
      <lineSegments geometry={strutsGeo}>
        <lineBasicMaterial
          color="#1897b4"
          transparent
          opacity={0.10}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  )
}

function Scene({ imageUrl, reduced, bloom }) {
  const data = useFaceData(imageUrl)
  return (
    <>
      {data && <FaceMesh data={data} reduced={reduced} />}
      <Dust />
      {bloom && (
        <EffectComposer disableNormalPass>
          <Bloom
            mipmapBlur
            intensity={1.05}
            luminanceThreshold={0.18}
            luminanceSmoothing={0.25}
            radius={0.75}
          />
        </EffectComposer>
      )}
    </>
  )
}

export default function ParticleFace({ imageUrl = './profile-side.jpeg' }) {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  // bloom off on small screens to keep mobile smooth
  const bloom =
    typeof window !== 'undefined' ? window.innerWidth > 768 && !reduced : true

  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 0, 20], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <Scene imageUrl={imageUrl} reduced={reduced} bloom={bloom} />
    </Canvas>
  )
}
