# World Cup 2026 Sweepstake

A live leaderboard, group tables, and knockout bracket for a 6-player World Cup 2026 sweepstake — no database, no real names, deployed on Netlify.

**Live site:** https://wholesome-queens-wc-sweepstake.netlify.app

## How it works

- 6 players each drafted 8 of the 48 World Cup teams (colour-coded, shown publicly under animal aliases).
- 🏆 Champion (£30) and 🥈 runner-up (£20) prizes go to whoever drafted the two World Cup finalists — resolved once the Final is played.
- 🥄 The £10 "wooden spoon" goes to whoever has the *lowest* total points (win = 2, draw = 1, loss = 0) across all matches played by their 8 teams.
- Live data comes from [API-Football](https://www.api-football.com/), fetched server-side and revalidated every ~90 seconds.

## Development

```bash
npm install
npm run dev
```

Requires an `API_FOOTBALL_KEY` environment variable — see `.env.example`. Without it, the site falls back to a "live scores unavailable" banner instead of crashing.

## Data

Player/team assignments (colours, animal aliases, API-Football team IDs) are embedded as static data in `src/data/sweepstake.json` — this is the only "database" the app uses.

## Deployment

Deployed on Netlify via the zero-config Next.js adapter, connected to this GitHub repo — every push to `main` triggers a new production build.
