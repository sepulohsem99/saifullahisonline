# Cara generate hero video guna Kling AI (free tier)

Website ni dah siap support scroll-scrub: bila `public/hero.mp4` wujud,
hero akan pin ~3 skrin dan video di-scrub ikut scroll (macam reference).
Kalau `public/appium-logo.png` pun ada, logo Appium sebenar akan fade in
atas gumpalan donut kat hujung scroll — sharp, tak herot.

## Kredit free (setakat Jul 2026)

- Login harian dapat **66 kredit free** — reset tiap hari, tak terkumpul
- Video **Standard (Std) 5 saat ≈ 10–20 kredit** → cukup untuk beberapa cubaan sehari
- Free tier = 720p + watermark kecil (boleh crop/cover kemudian kalau kacau)
- Mode Professional/model tertinggi lagi mahal (40–100 kredit) — elak dulu

## Langkah demi langkah

1. **klingai.com** → Sign in (Google pun boleh)
2. Sidebar kiri → **AI Videos** → pilih **Image to Video**
   - Cari tab/butang **"Frames"** atau **"Start & End Frame"**
     (URL terus: `kling.ai/app/image-to-video/frame-mode/new`)
3. **Start frame** → upload `public/kling-start-frame.jpg` (gambar kau, studio cerah)
4. **End frame** → upload `public/kling-end-frame.jpg` (donut fiber yang dah aku render)
5. **Model & mode:** pilih model terbaru yang available, mode **Std / Standard**, durasi **5s**
6. **Prompt** — paste ni:

```
Cinematic transformation, organic motion, continuous evolution.
The man's head and body slowly dissolve into hundreds of thin white
fiber-optic strands with glowing warm orange tips. The strands flow,
swirl and weave themselves together into a glowing woven torus ring
floating in the center. Light grey studio background stays clean and
minimal. Soft studio lighting, shallow depth of field, smooth slow
motion, high detail.
```

7. **Negative prompt** (kalau ada field):

```
text, watermark, logo, extra person, distorted face, flicker, jump cut
```

8. Tekan **Generate** → tunggu 2–5 minit
9. **Download** MP4 → rename & letak sebagai **`public/hero.mp4`** dalam projek ni
10. (Optional) Download logo Appium official (appium.io / github.com/appium) →
    simpan sebagai **`public/appium-logo.png`**
11. Refresh site → scroll → muka terurai → strands menggumpal jadi donut →
    logo Appium fade in. Siap.

## Tips kalau hasil tak cantik

- Generate 2–3 kali (seed lain tiap kali) — pilih yang paling smooth. 66 kredit muat ±4 cubaan Std 5s
- Kalau transition terlalu pantas, cuba 10s Std (±20–40 kredit)
- Kalau muka herot awal video: tambah "keep the face photorealistic and
  unchanged for the first second" dalam prompt
- Jangan suruh Kling buat logo Appium — AI video akan herotkan logo.
  Biar website yang overlay logo sebenar (dah automatik)
