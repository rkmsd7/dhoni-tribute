# MS Dhoni · The Journey

A sourced, data-driven tribute site to Mahendra Singh Dhoni: timeline, every match, statistics, records, captaincy, wicketkeeping, IPL, moments with ball-by-ball replays, trophies, photographs, videos and the man beyond the game.

No build step. Static HTML + CSS + vanilla JS; every page renders from `data/*.json` (schema in `data/SCHEMA.md`).

```bash
node serve.js        # http://localhost:4179
```

Live at https://dhoni-tribute-7.vercel.app (Vercel; `vercel.json` enables clean URLs).

## Data sources
- Headline totals: ICC Hall of Fame citation (June 2025), ESPNcricinfo player records.
- Match archive, charts, replays: computed from [Cricsheet](https://cricsheet.org) ball-by-ball data (ODbL). Coverage per format is stated on the Every match page.
- Photographs: Wikimedia Commons, licence shown with each image. Videos: YouTube embeds from official channels.
- Text: CC BY-SA 4.0.
