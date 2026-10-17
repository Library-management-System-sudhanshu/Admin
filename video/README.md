# Trishul — Less admin. More focus.

Editable Remotion reel: **1080 × 1920, 30 fps, 540 frames / 18 seconds**.

## Preview and export

```sh
cd /Users/sudhanshukumar/Desktop/Admin/video
npm install
npm run studio
npm run render
```

The MP4 is written to `out/trishul-reel.mp4`. H.264 export, CRF 18, with audio. `npm run still` exports a cover frame. The first render may download Remotion's Chrome Headless Shell. `npm run typecheck` validates source. No changes to the main app dependencies are needed.

## Edit

- `src/config.ts`: all scene copy, durations, image paths and CTA.
- `src/Reel.tsx`: editable text, spring motion, tap rings, card motion, checklist and iris reveals.
- `src/style.css`: typography, ivory/black/red palette, grain, shadows and layout.
- `public/screens/`: replace these PNGs with your own approved screenshots, keeping filenames, or change paths in config. Wide card screenshots work best.
- `scripts/make_audio.py`: original synthesized 120 BPM instrumental, pops, checklist clicks and whooshes. Run `npm run audio` to regenerate. Replace `public/soundtrack.wav` with licensed music if desired. No voiceover is included.

The CTA is **Register your hall / Discover Trishul**. Set `CTA_DETAIL` to your real public website or Instagram handle before publishing if you want a direct destination. No unverified link or account handle is invented.

## Source images

Captured from the actual local Trishul frontend on 16 October 2026:

- `home.png`: public homepage.
- `seats.png`, `fees.png`, `students.png`: interactive product previews on the public homepage.

These are actual project screenshots, **not authenticated dashboard captures**. The site's preview numbers and names are sample data; the reel labels them accordingly. No customer database screenshots are included. No stock photographs or reference creator assets are included. The art direction uses original vector/CSS objects, emoji accents and project imagery in place of photographic people.

## Scene plan

| Time | Scene |
| --- | --- |
| 0–2s | Your hall. Less chaos. / real homepage |
| 2–3.5s | Too much admin? / oversized keyboard |
| 3.5–5s | Seats. Fees. Students. / kinetic type |
| 5–7s | Make space for clarity. / seat preview + bulb |
| 7–9s | Every fee. In view. / fee preview |
| 9–11s | Your day, organised. / pinned checklist |
| 11–12.5s | Less admin. More focus. |
| 12.5–14.5s | Meet trishul. / brand and homepage |
| 14.5–16s | Scattered? Connected. / student preview |
| 16–18s | Make room for better. / registration CTA |

Hard cuts dominate; two circular reveals vary the rhythm. Most copy sits within x=76–970 and y=200–1500, leaving space for Instagram overlays. All motion is frame-driven and deterministic. Emoji appearance can vary by rendering OS. The MP4 has animated interaction cues; it is not clickable. Edit and scrub the composition in Remotion Studio.

## Publishing

Upload the rendered MP4 manually as an Instagram Reel. Review the final video, CTA and any replacement images first. Suggested caption:

> Less admin. More focus. Meet Trishul — one workspace for your study hall's seats, students and fees. Discover a more organised day. #Trishul #StudyHall #LibraryManagement

Remotion references: https://www.remotion.dev/docs/spring and https://www.remotion.dev/docs/cli/render
