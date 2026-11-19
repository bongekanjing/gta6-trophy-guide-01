# Leonida Trophy Atlas — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/bongekanjing/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/bongekanjing/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI (released 19 November 2026), built for the [gta6-trophy-guide-01 bounty on make.fun](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

- **Every trophy** with its official name, description and grade as PlayStation publishes them, plus a guide in our own words — what to do, where and how, and when it can be missed — with the source cited beside each one.
- **A tracker**: tick trophies off and your progress saves in the browser (localStorage). Export it to a file and import it back on any machine.
- **Filters by kind** (Story, Side quests, Collectibles, Activities, Robberies, 100%, Misc), by grade, by search, earned-only and missable-only.
- **A spoiler setting** (on by default) that hides the names and descriptions of the 12 hidden story trophies until they are earned.
- **A roadmap to the platinum** in three phases — story (60–80 h), the 100% checklist (~100 h), cleanup (~10 h) — with the one missable trophy flagged, a cheats warning, and save advice.
- **Honest about the unknown**: four trophies had no confirmed unlock method at launch (In The Beginning…, Bad Luck, I Guess, The Truth Is Out There, Ten Pin). The guide says so plainly on each instead of inventing steps.

## The numbers

55 trophies: 1 Platinum, 2 Gold, 6 Silver, 46 Bronze. All offline, all single-player. One playthrough is enough; there is no mission replay and no New Game+. PowerPyx rates the set 4/10 and about 200 hours; Push Square warns it can run past 300. The only potentially missable trophy is Positive Mental Attitude (a Chapter 1 meditation).

## Run it

The guide is plain static files under `app/` — no build step, no network at runtime:

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

Or open `app/index.html` from any static server. `main.ts` (Node 22) copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` for the make.fun scorer:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

- Trophy list: Exophase via [Planet GTA 6](https://www.planetgta6.com/en/gta-6-trophies/), cross-checked with PSNProfiles and TrueAchievements.
- Guides and roadmap: [PowerPyx — GTA 6 Trophy Guide & Roadmap](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/) and [Push Square — GTA 6 Trophy Guide & Roadmap](https://www.pushsquare.com/guides/gta-6-trophy-guide-and-roadmap). Every trophy cites its sources in the app.

## License

MIT — see [LICENSE](LICENSE). An unofficial fan guide; Grand Theft Auto, GTA and Rockstar Games are trademarks of their owners. No official artwork, logo or game screenshot is used.
