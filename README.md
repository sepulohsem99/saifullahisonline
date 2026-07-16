# 3D Portfolio — AI Automation Tester

A 3D portfolio website. The hero renders your green-screen side-profile photo as a
live particle/mesh face (chroma-keyed, connected into a robot-like wireframe) using
Three.js + React Three Fiber.

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL (default http://localhost:5173).

## Edit your content

Everything text/link-based lives in **`src/config.js`** — name, role, tagline,
about, expertise, projects, tech stack, and social links. No need to touch components.

Photos live in **`public/`**:
- `profile-side.jpeg` — drives the 3D hero mesh (keep a green background for clean keying)
- `profile-round.jpeg` — About section photo
- `profile-front.jpeg` — spare

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

## Deploy (free)

**Vercel** — import the repo, or `npx vercel`. Config in `vercel.json`.
**Netlify** — drag the `dist/` folder to app.netlify.com, or connect the repo. Config in `netlify.toml`.

Both are zero-config here: build `npm run build`, publish `dist`.

## Tuning the face

In `src/components/ParticleFace.jsx`, `useFaceData` options:
- `targetW` — sampling resolution (more = denser mesh, heavier)
- `depth` — how much facial features pop in Z
- the `isGreen()` function — tweak thresholds if your background isn't the same green
